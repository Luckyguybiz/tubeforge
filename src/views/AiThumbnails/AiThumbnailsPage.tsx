'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

/* ── Constants ──────────────────────────────────────────────────────── */

const ACCENT_GLOW = 'rgba(99,102,241,0.4)';

type TabId = 'scratch' | 'swap';
type FormatId = '16:9' | '9:16';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  revisedPrompt?: string;
  parentId?: string;
}

const COUNT_OPTIONS = [1, 2, 3] as const;
const FORMAT_OPTIONS: { id: FormatId; label: string; pro: boolean }[] = [
  { id: '16:9', label: '16:9', pro: false },
  { id: '9:16', label: '9:16', pro: false },
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

/* ── Progress stage helper ──────────────────────────────────────────── */

function getProgressStage(p: number, t: (k: string) => string): string {
  if (p < 20) return t('aithumbs.progress.analyzing');
  if (p < 50) return t('aithumbs.progress.composing');
  if (p < 80) return t('aithumbs.progress.creating');
  if (p < 95) return t('aithumbs.progress.finalTouches');
  return t('aithumbs.progress.done');
}

/* ── Main Component ─────────────────────────────────────────────────── */

export function AiThumbnailsPage() {
  const t = useLocaleStore((s) => s.t);
  const { plan } = usePlanLimits();
  const C = useThemeStore((s) => s.theme);

  /* ── State ──────────────────────────────────────── */
  const [tab, setTab] = useState<TabId>('scratch');
  const [prompt, setPrompt] = useState('');
  const [count, setCount] = useState<1 | 2 | 3>(1);
  const [format, setFormat] = useState<FormatId>('16:9');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [lastBatch, setLastBatch] = useState<GeneratedImage[]>([]);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  /* AI Ideas */
  const [aiIdeas, setAiIdeas] = useState<string[]>([]);

  /* Progress */
  const [progress, setProgress] = useState(0);
  const [imageRevealed, setImageRevealed] = useState(false);
  const pendingRevealRef = useRef<(() => void) | null>(null);

  /* YouTube context */
  const [ytUrl, setYtUrl] = useState('');
  const [ytTitle, setYtTitle] = useState<string | null>(null);
  const [showYtModal, setShowYtModal] = useState(false);
  const [ytModalInput, setYtModalInput] = useState('');

  /* Voice input */
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  /* Upload photo */
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Gallery modal */
  const [showGallery, setShowGallery] = useState(false);

  /* Responsive */
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* ── tRPC mutations ─────────────────────────────── */
  const generate = trpc.aiThumbnails.generate.useMutation({
    onMutate: () => {
      setProgress(0);
      setImageRevealed(false);
    },
    onSuccess: (data) => {
      const imgs: GeneratedImage[] = data.images.map(
        (img: { url: string; id: string; revisedPrompt?: string }) => ({
          id: img.id || uid(),
          url: img.url,
          prompt: data.prompt,
          style: data.style ?? 'realistic',
          revisedPrompt: img.revisedPrompt,
        }),
      );
      toast.success(t('aithumbs.toast.success'));
      pendingRevealRef.current = () => {
        setSelectedImage(imgs[0] || null);
        setHistory((prev) => [...imgs, ...prev].slice(0, 20));
        setImageRevealed(true);
      };
      setProgress((p) => (p >= 100 ? 100 : p));
    },
    onError: (err) => {
      setProgress(0);
      toast.error(err.message || t('aithumbs.toast.genFailed'));
    },
  });

  const editMutation = trpc.aiThumbnails.edit.useMutation({
    onMutate: () => {
      setProgress(0);
      setImageRevealed(false);
    },
    onSuccess: (data) => {
      const img: GeneratedImage = {
        id: data.id || uid(),
        url: data.url,
        prompt: t('aithumbs.enhancedVersion'),
        style: 'realistic',
        parentId: selectedImage?.id,
      };
      toast.success(t('aithumbs.toast.enhanced'));
      pendingRevealRef.current = () => {
        setSelectedImage(img);
        setHistory((prev) => [img, ...prev].slice(0, 20));
        setImageRevealed(true);
      };
      setProgress((p) => (p >= 100 ? 100 : p));
    },
    onError: (err) => {
      setProgress(0);
      toast.error(err.message || t('aithumbs.toast.enhanceFailed'));
    },
  });

  const suggestIdeas = trpc.aiThumbnails.suggestIdeas.useMutation({
    onSuccess: (data) => {
      if (data.ideas.length > 0) {
        setAiIdeas(data.ideas);
      } else {
        toast.info(t('aithumbs.toast.noIdeas'));
      }
    },
    onError: (err) => {
      toast.error(err.message || t('aithumbs.toast.ideasFailed'));
    },
  });

  /* ── Progress simulation ─────────────────────────── */
  const isGenerating = generate.isPending || editMutation.isPending;

  useEffect(() => {
    if (!isGenerating) return;
    setProgress(0);
    pendingRevealRef.current = null;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p;
        return Math.min(95, p + Math.random() * 4 + 1);
      });
    }, 600);
    return () => clearInterval(interval);
  }, [isGenerating]);

  /* Fast animation to 100% once result is ready, then reveal */
  useEffect(() => {
    if (isGenerating || !pendingRevealRef.current) return;
    if (progress >= 100) {
      const reveal = pendingRevealRef.current;
      pendingRevealRef.current = null;
      reveal();
      return;
    }
    const interval = setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 8);
        return next;
      });
    }, 30);
    return () => clearInterval(interval);
  }, [isGenerating, progress]);

  /* ── Handlers ───────────────────────────────────── */

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || generate.isPending) return;
    generate.mutate({
      prompt: prompt.trim(),
      style: 'realistic',
      count,
      format,
      youtubeUrl: ytUrl || undefined,
      photoUrl: uploadedPhoto || undefined,
    });
  }, [prompt, count, format, generate, ytUrl, uploadedPhoto]);

  const handleRegenerate = useCallback(() => {
    if (!selectedImage || generate.isPending) return;
    generate.mutate({
      prompt: selectedImage.prompt,
      style: 'realistic',
      count: 1,
      format,
    });
  }, [selectedImage, generate, format]);

  const handleDownload = useCallback(async (img: GeneratedImage) => {
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      // Build filename from prompt keywords
      const keywords = (img.prompt || 'thumbnail')
        .replace(/[«»"'*\n]/g, '')
        .split(/[\s,.!?]+/)
        .filter(w => w.length > 2 && w.length < 20)
        .slice(0, 4)
        .join('-')
        .toLowerCase()
        .replace(/[^a-zа-яёA-ZА-ЯЁ0-9-]/g, '') || 'thumbnail';
      const date = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tubeforge-${keywords}-${date}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(img.url, '_blank');
    }
  }, []);

  /* ── YouTube URL fetch ──────────────────────────── */
  const handleYtUrl = useCallback(async (url: string) => {
    setYtUrl(url);
    const vid = extractVideoId(url);
    if (!vid) {
      setYtTitle(null);
      return;
    }
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${vid}`,
      );
      const data = await res.json();
      setYtTitle(data.title ?? null);
    } catch {
      setYtTitle(null);
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
    recognition.lang = 'ru-RU';
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

  /* ── AI Ideas ──────────────────────────────────── */
  const handleGetIdeas = useCallback(() => {
    if (suggestIdeas.isPending) return;
    suggestIdeas.mutate({ topic: prompt.trim() || undefined, locale: locale as 'en' | 'ru' | 'kk' | 'es' });
  }, [suggestIdeas, prompt, locale]);

  /* ── Helpers ─────────────────────────────────────── */

  const isLoading = generate.isPending;
  const disabled = !prompt.trim() || isLoading;

  const progressPct = Math.round(progress);

  /* ── Gallery query (for modal) ── */
  const galleryQuery = trpc.aiThumbnails.getGallery.useQuery(
    { filter: 'all', limit: 30 },
    { enabled: showGallery },
  );

  /* ── Render ─────────────────────────────────────── */

  return (
    <div style={{ background: DARK_BG, color: '#fff', fontFamily: 'inherit', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ═══ TOP BAR ═══ */}
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            padding: '0 18px',
            borderBottom: `1px solid rgba(255,255,255,0.06)`,
            background: CARD_BG,
            flexShrink: 0,
            gap: 12,
          }}
        >
          {/* Logo + Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: C.accentDim,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>
              {t('aithumbs.title')}
            </span>
          </div>

          {/* My Works button */}
          <button
            onClick={() => setShowGallery(true)}
            style={{
              padding: '6px 14px', borderRadius: 8,
              border: `1px solid ${C.border}`, background: 'transparent',
              color: C.sub, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
              display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
            </svg>
            {t('aithumbs.myWorks')}
          </button>

          {/* Credits badge */}
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 20,
              background: C.accentDim,
              border: `1px solid ${C.accent}26`,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.accent }}>
              ∞
            </span>
          </div>
        </div>

        {/* ═══ MAIN CONTENT ═══ */}
        <div
          style={{
            flex: 1, display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: 0, overflow: 'hidden', minHeight: 0,
          }}
        >
          {/* ═══ LEFT PANEL (Settings) ═══ */}
          <div
            style={{
              width: isMobile ? '100%' : 360,
              flexShrink: 0,
              background: CARD_BG,
              borderRight: isMobile ? 'none' : `1px solid rgba(255,255,255,0.06)`,
              borderBottom: isMobile ? `1px solid rgba(255,255,255,0.06)` : 'none',
              padding: '16px 18px',
              display: 'flex', flexDirection: 'column', gap: 12,
              overflowY: 'auto',
              maxHeight: isMobile ? 'none' : '100%',
            }}
          >
            {/* 1. Mode tabs */}
            <div style={{ display: 'flex', gap: 8 }}>
              {(['scratch', 'swap'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTab(m)}
                  onMouseEnter={(e) => {
                    if (tab !== m) {
                      e.currentTarget.style.borderColor = ACCENT;
                      e.currentTarget.style.boxShadow = `0 0 12px ${ACCENT_GLOW}, inset 0 0 8px ${ACCENT}10`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (tab !== m) {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10,
                    background: tab === m ? SURFACE_BG : 'transparent',
                    border: `1px solid ${tab === m ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
                    color: tab === m ? '#fff' : 'rgba(255,255,255,0.4)',
                    cursor: 'pointer', fontSize: 11, fontWeight: 700,
                    textTransform: 'uppercase', letterSpacing: 1,
                    fontFamily: 'inherit', transition: 'all 0.3s ease', outline: 'none',
                  }}
                >
                  <div
                    style={{
                      width: 30, height: 30, borderRadius: 8,
                      background: ACCENT_DIM,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {m === 'scratch' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

            {/* Face swap gallery (when swap tab active) */}
            {tab === 'swap' && (
              <div style={{
                padding: 12, borderRadius: 10,
                border: `1px solid ${C.border}`,
                background: C.card,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  {t('aithumbs.myPhotos')}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {uploadedPhoto ? (
                    <div style={{ position: 'relative', width: 56, height: 56 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={uploadedPhoto} alt="Face" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', border: `2px solid ${C.accent}` }} />
                      <button
                        onClick={() => setUploadedPhoto(null)}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: 9, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, fontSize: 10 }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                      </button>
                    </div>
                  ) : null}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    style={{
                      width: 56, height: 56, borderRadius: 10,
                      border: `1px dashed ${C.borderActive}`,
                      background: 'transparent', color: C.dim,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease', padding: 0,
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                  </button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
              </div>
            )}

            {/* 2. Prompt section */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {t('aithumbs.prompt.label')} <span style={{ color: C.accent }}>*</span>
                </span>
                <span style={{ fontSize: 11, color: prompt.length > 900 ? C.red : C.dim }}>
                  {prompt.length}/1000
                </span>
              </div>

              <textarea
                value={prompt}
                onChange={(e) => { if (e.target.value.length <= 1000) setPrompt(e.target.value); }}
                placeholder={t('aithumbs.prompt.placeholder')}
                rows={4}
                style={{
                  width: '100%', minHeight: 80, padding: 12,
                  borderRadius: 10, border: `1px solid rgba(255,255,255,0.08)`,
                  background: SURFACE_BG, color: '#fff',
                  fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                  outline: 'none', transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box', lineHeight: 1.5,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.accent + '60'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />

              <p style={{ margin: '6px 0 0', fontSize: 11, color: theme.dim, lineHeight: 1.4 }}>
                {t('aithumbs.prompt.hint') || 'Опишите визуал превью: персонаж, фон, цвета, эмоции. Текст на превью добавляйте в Дизайн Студии.'}
              </p>

              {/* Action icons row */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {/* YouTube link */}
                <SmallIconBtn
                  active={!!ytTitle}
                  onClick={() => {
                    setYtModalInput('');
                    setShowYtModal(true);
                  }}
                  title={t('aithumbs.ytUrl.title')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                  </svg>
                </SmallIconBtn>

                {/* Upload image */}
                <SmallIconBtn
                  active={!!uploadedPhoto}
                  onClick={() => fileInputRef.current?.click()}
                  title={t('aithumbs.upload.title')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </SmallIconBtn>
                {tab !== 'swap' && (
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                )}

                {/* Voice input */}
                <SmallIconBtn
                  active={isListening}
                  danger={isListening}
                  onClick={toggleVoice}
                  title={t('aithumbs.voice.title')}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </svg>
                </SmallIconBtn>
              </div>
            </div>

            {/* YouTube title chip */}
            {ytTitle && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', borderRadius: 10,
                background: C.accentDim, border: `1px solid ${C.accent}20`,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
                  <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                </svg>
                <span style={{ fontSize: 12, color: C.accent, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {ytTitle}
                </span>
                <button
                  onClick={() => { setYtUrl(''); setYtTitle(null); }}
                  style={{ width: 20, height: 20, borderRadius: 10, border: 'none', background: 'transparent', color: C.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            )}

            {/* 3. "Need an idea?" button + AI idea chips */}
            <button
              onClick={handleGetIdeas}
              disabled={suggestIdeas.isPending}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: C.sub, cursor: suggestIdeas.isPending ? 'wait' : 'pointer',
                fontFamily: 'inherit', outline: 'none', transition: 'all 0.2s ease',
                fontSize: 13, fontWeight: 600,
                opacity: suggestIdeas.isPending ? 0.6 : 1,
              }}
            >
              {suggestIdeas.isPending ? (
                <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'ait-spin 1s linear infinite', flexShrink: 0 }}>
                  <circle cx="7" cy="7" r="5" stroke={C.accent} strokeWidth="1.5" fill="none" opacity="0.3" />
                  <path d="M7 2a5 5 0 013.54 1.46" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              )}
              {suggestIdeas.isPending ? t('aithumbs.generatingIdeas') : t('aithumbs.suggestIdea')}
            </button>

            {aiIdeas.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {aiIdeas.map((idea, i) => (
                  <button
                    key={i}
                    onClick={() => { setPrompt(idea); setAiIdeas([]); }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: `1px solid ${C.accent}30`,
                      background: C.accentDim,
                      color: C.text,
                      fontSize: 12,
                      lineHeight: 1.4,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={idea}
                  >
                    {idea.length > 80 ? idea.slice(0, 80) + '...' : idea}
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: C.border }} />

            {/* Count & Format row */}
            <div style={{ display: 'flex', gap: 16 }}>
              {/* Count */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                  {t('aithumbs.section.count')}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {COUNT_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCount(c as 1 | 2 | 3)}
                      style={{
                        position: 'relative', width: 40, height: 36, borderRadius: 8,
                        border: `1px solid ${count === c ? C.accent : C.border}`,
                        background: count === c ? C.accentDim : 'transparent',
                        color: count === c ? C.accent : C.sub,
                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none', padding: 0,
                      }}
                    >
                      {c}
                      {c > 1 && plan === 'FREE' && (
                        <span style={{ fontSize: 8, fontWeight: 800, color: ACCENT, background: ACCENT_DIM, padding: '1px 5px', borderRadius: 4, letterSpacing: 0.5, lineHeight: 1, position: 'absolute', top: -6, right: -6 }}>
                          {t('aithumbs.proBadge')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Format */}
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                  {t('aithumbs.section.format')}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      style={{
                        position: 'relative', padding: '7px 14px', borderRadius: 8,
                        border: `1px solid ${format === f.id ? C.accent : C.border}`,
                        background: format === f.id ? C.accentDim : 'transparent',
                        color: format === f.id ? C.accent : C.sub,
                        fontSize: 12, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none',
                      }}
                    >
                      {f.id === '16:9' ? '\uD83D\uDDA5' : '\uD83D\uDCF1'} {f.id}
                      {f.pro && plan === 'FREE' && (
                        <span style={{ fontSize: 8, fontWeight: 800, color: ACCENT, background: ACCENT_DIM, padding: '1px 5px', borderRadius: 4, letterSpacing: 0.5, lineHeight: 1, position: 'absolute', top: -6, right: -6 }}>
                          {t('aithumbs.proBadge')}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Credit cost */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: C.accentDim }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>
                {count} {count > 1 ? t('aithumbs.credits') : t('aithumbs.credit')}
              </span>
            </div>

            {/* 5. CTA Button */}
            <button
              onClick={handleGenerate}
              disabled={disabled}
              aria-busy={isLoading || undefined}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 12,
                background: disabled ? C.border : `linear-gradient(135deg, ${C.accent}, #818cf8)`,
                color: disabled ? C.dim : '#fff',
                fontSize: 15, fontWeight: 700, border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: disabled ? 'none' : `0 4px 20px ${ACCENT_GLOW}`,
                transition: 'all 0.2s ease', fontFamily: 'inherit', outline: 'none', flexShrink: 0,
                marginTop: 'auto',
              }}
            >
              {isLoading && (
                <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: 'ait-spin 1s linear infinite' }}>
                  <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,.3)" strokeWidth="2" fill="none" />
                  <path d="M9 2a7 7 0 015.2 2.33" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
                </svg>
              )}
              {isLoading ? t('aithumbs.generating') : t('aithumbs.createMagic')}
            </button>
            </div>

          </div>

          {/* ═══ RIGHT PANEL (Result / Preview) ═══ */}
          <div
            style={{
              flex: 1, minWidth: 0, maxWidth: 1000,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', padding: '12px 16px',
              gap: 10,
            }}
          >
            {/* Preview badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '5px 14px', borderRadius: 20,
                  background: C.accentDim, border: `1px solid ${C.accent}1a`,
                  fontSize: 11, fontWeight: 700, color: C.accent,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}
              >
                {t('aithumbs.preview')} {format}
              </span>
              <div style={{ flex: 1 }} />

              {/* Post-generation actions */}
              {selectedImage && !isGenerating && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <ActionPill
                    label={t('aithumbs.action.download')}
                    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
                    onClick={() => selectedImage && handleDownload(selectedImage)}
                    accent
                  />
                  <ActionPill
                    label={t('aithumbs.regenerate')}
                    icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>}
                    onClick={handleRegenerate}
                  />
                </div>
              )}
            </div>

            {/* Preview area */}
            <div
              style={{
                flex: 1, borderRadius: 16, background: C.bg,
                border: `1px solid ${C.border}`,
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden', minHeight: 0,
                position: 'relative',
              }}
            >
              {isGenerating ? (
                /* ═══ SCANNER ANIMATION ═══ */
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: C.bg,
                }}>
                  {/* Scanning bar — horizontal for 16:9, vertical for 9:16 */}
                  <div
                    className="ait-scanner-bar"
                    style={{
                      position: 'absolute',
                      top: 0, bottom: 0,
                      width: 3,
                      background: C.accent,
                      boxShadow: `0 0 30px 10px ${ACCENT_GLOW}, 0 0 60px 20px ${ACCENT_GLOW}`,
                      animation: format === '9:16' ? 'ait-scan-v 4s ease-in-out infinite' : 'ait-scan 4s ease-in-out infinite',
                      zIndex: 2,
                    }}
                  />

                  {/* Horizontal lens flare lines */}
                  <div
                    className="ait-flare-top"
                    style={{
                      position: 'absolute',
                      top: 0, left: 0, right: 0,
                      height: 1,
                      background: `linear-gradient(90deg, transparent 20%, ${C.accent}40 50%, transparent 80%)`,
                      boxShadow: `0 0 15px 3px ${ACCENT_GLOW}`,
                      animation: 'ait-flare 3s ease-in-out infinite',
                      zIndex: 1,
                    }}
                  />
                  <div
                    className="ait-flare-bottom"
                    style={{
                      position: 'absolute',
                      bottom: 0, left: 0, right: 0,
                      height: 1,
                      background: `linear-gradient(90deg, transparent 20%, ${C.accent}40 50%, transparent 80%)`,
                      boxShadow: `0 0 15px 3px ${ACCENT_GLOW}`,
                      animation: 'ait-flare 3s ease-in-out infinite reverse',
                      zIndex: 1,
                    }}
                  />

                  {/* Center content: percentage + stage */}
                  <div style={{
                    zIndex: 3, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 12,
                  }}>
                    <div style={{
                      fontSize: 72, fontWeight: 800, color: C.text,
                      textShadow: `0 0 40px ${ACCENT_GLOW}, 0 0 80px ${ACCENT_GLOW}`,
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {progressPct}%
                    </div>
                    <div style={{
                      fontSize: 14, fontWeight: 600,
                      color: C.sub,
                      textAlign: 'center',
                    }}>
                      {getProgressStage(progress, t)}
                    </div>
                  </div>

                  {/* Subtle grid overlay */}
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 0,
                    backgroundImage: isDark ? `
                      linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
                    ` : `
                      linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                  }} />
                </div>
              ) : selectedImage ? (
                /* ═══ Generated result ═══ */
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: 16, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: '100%',
                      maxWidth: format === '16:9' ? 960 : 400,
                      aspectRatio: format === '16:9' ? '16/9' : '9/16',
                      maxHeight: '65vh',
                      position: 'relative', overflow: 'hidden', borderRadius: 12,
                      background: '#000',
                      boxShadow: `0 0 20px ${C.accent}10, 0 4px 16px rgba(0,0,0,0.3)`,
                      margin: '0 auto',
                    }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedImage.url}
                        alt={selectedImage.prompt}
                        style={{
                          width: '100%', height: '100%', objectFit: 'contain', display: 'block',
                          filter: imageRevealed ? 'blur(0px)' : 'blur(20px)',
                          transform: imageRevealed ? 'scale(1)' : 'scale(1.05)',
                          transition: 'filter 0.8s ease-out, transform 0.8s ease-out',
                        }}
                        onLoad={() => setImageRevealed(true)}
                      />
                    </div>
                  </div>

                  {/* Batch variants row — shown when multiple images generated */}
                  {lastBatch.length > 1 && (
                    <div style={{ padding: '0 16px 12px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: theme.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                        {t('aithumbs.section.count')} ({lastBatch.length})
                      </span>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {lastBatch.map((img, idx) => {
                          const isActive = selectedImage?.id === img.id;
                          return (
                            <button
                              key={img.id}
                              onClick={() => { setSelectedImage(img); setImageRevealed(true); }}
                              style={{
                                padding: 0, flex: 1, aspectRatio: format === '16:9' ? '16/9' : '9/16',
                                maxHeight: 80,
                                border: isActive ? `3px solid ${ACCENT}` : `1px solid ${theme.border}`,
                                borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                                background: theme.surface, outline: 'none',
                                transition: 'all 0.2s ease',
                                boxShadow: isActive ? `0 0 12px ${ACCENT_GLOW}` : 'none',
                              }}
                            >
                              <img src={img.url} alt={`Variant ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* History row */}
                  {history.length > 1 && (
                    <div style={{ padding: '0 16px 16px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                        {t('aithumbs.tab.history')} ({history.length})
                      </span>
                      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                        {history.map((img) => {
                          const isActive = selectedImage?.id === img.id;
                          return (
                            <button
                              key={img.id}
                              onClick={() => {
                                setSelectedImage(img);
                                setImageRevealed(true);
                              }}
                              style={{
                                padding: 0, width: 80, height: 45, flexShrink: 0,
                                border: isActive ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                                borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                                background: isDark ? '#000' : '#e8e8ed', outline: 'none', transition: 'all 0.2s ease',
                              }}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.url} alt={img.prompt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ═══ Empty placeholder ═══ */
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 16, padding: 40,
                  animation: 'ait-fadeIn 0.4s ease-out',
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 16,
                    background: ACCENT_DIM,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>
                      {t('aithumbs.empty.title')}
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 300, lineHeight: 1.5 }}>
                      {t('aithumbs.empty.description')}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Premium banner */}
            {plan === 'FREE' && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12, border: `1px solid ${ACCENT}33`,
                  background: `linear-gradient(135deg, ${ACCENT}14, transparent)`,
                  display: 'flex', alignItems: 'center', gap: 16,
                  flexShrink: 0,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 2 }}>
                    {t('aithumbs.banner.title')}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    {t('aithumbs.banner.desc')}
                  </div>
                </div>
                <a
                  href="/billing"
                  style={{
                    padding: '8px 20px', borderRadius: 8,
                    background: ACCENT, color: '#fff',
                    fontSize: 12, fontWeight: 700, textDecoration: 'none',
                    whiteSpace: 'nowrap', flexShrink: 0,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {t('aithumbs.banner.cta')}
                </a>
              </div>
            )}
          </div>
        </div>

      {/* ═══ Gallery Modal ═══ */}
      {showGallery && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowGallery(false); }}
        >
          <div
            style={{
              width: '100%', maxWidth: 900, maxHeight: '80vh',
              background: C.surface, borderRadius: 20,
              border: `1px solid ${C.border}`,
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Modal header */}
            <div style={{
              display: 'flex', alignItems: 'center', padding: '16px 20px',
              borderBottom: `1px solid ${C.border}`,
            }}>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.text, flex: 1 }}>
                {t('aithumbs.myWorks')}
              </span>
              <button
                onClick={() => setShowGallery(false)}
                style={{
                  width: 32, height: 32, borderRadius: 8, border: 'none',
                  background: C.border, color: C.text,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0,
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Gallery grid */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {galleryQuery.isLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, color: C.sub }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" style={{ animation: 'ait-spin 1s linear infinite', marginRight: 8 }}>
                    <circle cx="10" cy="10" r="8" stroke={C.accent} strokeWidth="1.5" fill="none" opacity="0.3" />
                    <path d="M10 2a8 8 0 015.66 2.34" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                  </svg>
                  {t('aithumbs.generating')}
                </div>
              ) : galleryQuery.data?.items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: C.dim }}>
                  {t('aithumbs.history.empty')}
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                }}>
                  {galleryQuery.data?.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedImage({
                          id: item.id,
                          url: item.imageUrl,
                          prompt: item.prompt,
                          style: item.style || 'realistic',
                        });
                        setImageRevealed(true);
                        setShowGallery(false);
                      }}
                      style={{
                        padding: 0, width: '100%', aspectRatio: '16/9',
                        border: `1px solid ${C.border}`,
                        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
                        background: isDark ? '#000' : '#e8e8ed', outline: 'none', transition: 'all 0.2s ease',
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.prompt} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ YouTube URL Modal ═══ */}
      {showYtModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        }} onClick={() => setShowYtModal(false)}>
          <div style={{
            background: isDark ? '#1a1a2e' : '#fff',
            borderRadius: 16, padding: 28, width: 420, maxWidth: '90vw',
            border: `1px solid ${theme.border}`,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 8px', color: theme.text, fontSize: 18 }}>
              {t('aithumbs.ytUrl.title')}
            </h3>
            <p style={{ margin: '0 0 16px', color: theme.sub, fontSize: 14 }}>
              {t('aithumbs.ytUrl.prompt')}
            </p>
            <input
              type="text"
              value={ytModalInput}
              onChange={e => setYtModalInput(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              style={{
                width: '100%', padding: '12px 14px', borderRadius: 10,
                border: `1px solid ${theme.border}`, background: isDark ? '#0a0a1a' : '#f5f5f5',
                color: theme.text, fontSize: 14, outline: 'none', boxSizing: 'border-box',
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && ytModalInput.trim()) {
                  handleYtUrl(ytModalInput.trim());
                  setShowYtModal(false);
                }
              }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowYtModal(false)}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: `1px solid ${theme.border}`,
                  background: 'transparent', color: theme.sub, cursor: 'pointer', fontSize: 14,
                }}
              >{t('common.cancel') || 'Отмена'}</button>
              <button
                onClick={() => { if (ytModalInput.trim()) { handleYtUrl(ytModalInput.trim()); setShowYtModal(false); } }}
                style={{
                  padding: '10px 20px', borderRadius: 10, border: 'none',
                  background: ACCENT, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
                }}
              >{t('common.add') || 'Добавить'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ CSS Animations ═══ */}
      <style>{`
        @keyframes ait-scan {
          0% { left: 0%; }
          50% { left: calc(100% - 3px); }
          100% { left: 0%; }
        }
        @keyframes ait-scan-v {
          0% { top: 0%; }
          50% { top: calc(100% - 3px); }
          100% { top: 0%; }
        }
        @keyframes ait-flare {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes ait-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes ait-pulse-glow {
          0%, 100% { box-shadow: 0 0 20px ${ACCENT_GLOW}; }
          50% { box-shadow: 0 0 40px ${ACCENT_GLOW}; }
        }
        @keyframes ait-fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

function SmallIconBtn({
  active,
  danger,
  onClick,
  title,
  children,
}: {
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const C = useThemeStore((s) => s.theme);
  const borderColor = danger ? C.red : active ? C.accent + '66' : C.border;
  const bg = danger ? C.red + '1e' : active ? C.accentDim : 'transparent';
  const color = danger ? C.red : active ? C.accent : C.sub;
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 34, height: 34, borderRadius: 8,
        border: `1px solid ${borderColor}`, background: bg, color,
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.2s ease', padding: 0, flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function ActionPill({
  label,
  icon,
  onClick,
  accent,
  loading,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
  loading?: boolean;
}) {
  const C = useThemeStore((s) => s.theme);
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 8,
        border: `1px solid ${accent ? C.accent + '99' : C.border}`,
        background: accent ? C.accentDim : 'transparent',
        color: accent ? C.accent : C.text,
        fontSize: 12, fontWeight: 600,
        cursor: loading ? 'wait' : 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s ease', outline: 'none',
        whiteSpace: 'nowrap', opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'ait-spin 1s linear infinite' }}>
          <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
          <path d="M6 2a4 4 0 012.83 1.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      ) : icon}
      {label}
    </button>
  );
}
