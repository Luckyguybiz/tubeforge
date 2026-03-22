'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThemeStore } from '@/stores/useThemeStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

/* ── Constants ──────────────────────────────────────────────────────── */

type TabId = 'scratch' | 'swap';
type StyleId = 'realistic' | 'anime' | 'cinematic' | '3d' | 'minimalist' | 'popart';
type FormatId = '16:9' | '9:16';
type AnalyticsTab = 'scores' | 'strengths' | 'improve' | 'titles';

interface StyleOption { id: StyleId; label: string; icon: string }
interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: StyleId;
  revisedPrompt?: string;
  parentId?: string;
}

interface CTRAnalysis {
  ctrScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  titleSuggestions: Array<{ title: string; score: number; reason: string }>;
  scores: { emotion: number; contrast: number; composition: number; clickability: number };
}

const STYLES: StyleOption[] = [
  { id: 'realistic', label: 'Realistic', icon: '\uD83D\uDCF7' },
  { id: 'anime', label: 'Anime', icon: '\uD83C\uDFAD' },
  { id: 'cinematic', label: 'Cinematic', icon: '\uD83C\uDFAC' },
  { id: '3d', label: '3D', icon: '\uD83E\uDDE9' },
  { id: 'minimalist', label: 'Minimal', icon: '\u25FB' },
  { id: 'popart', label: 'Pop Art', icon: '\uD83C\uDFA8' },
];

const COUNT_OPTIONS = [1, 2, 3] as const;
const FORMAT_OPTIONS: { id: FormatId; label: string; icon: string; pro: boolean }[] = [
  { id: '16:9', label: '16:9', icon: '\uD83D\uDDA5', pro: false },
  { id: '9:16', label: '9:16', icon: '\uD83D\uDCF1', pro: true },
];

const EXAMPLE_PROMPTS = [
  'A shocked face reacting to a massive explosion behind them',
  'Split screen: broke vs rich lifestyle comparison, luxury cars',
  'Close-up of hands opening a mysterious glowing box in dark room',
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
  const C = useThemeStore((s) => s.theme);
  const { canUseAI, remainingAI, plan } = usePlanLimits();

  /* ── State ──────────────────────────────────────── */
  const [tab, setTab] = useState<TabId>('scratch');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleId>('realistic');
  const [count, setCount] = useState<1 | 2 | 3>(1);
  const [format, setFormat] = useState<FormatId>('16:9');
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  /* AI Ideas */
  const [aiIdeas, setAiIdeas] = useState<string[]>([]);

  /* CTR Analysis */
  const [ctrAnalysis, setCtrAnalysis] = useState<CTRAnalysis | null>(null);
  const [ctrExpanded, setCtrExpanded] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('scores');
  const [animatedScore, setAnimatedScore] = useState(0);

  /* Progress */
  const [progress, setProgress] = useState(0);
  const [imageRevealed, setImageRevealed] = useState(false);

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

  /* CTR score count-up animation */
  useEffect(() => {
    if (!ctrAnalysis) { setAnimatedScore(0); return; }
    const target = ctrAnalysis.ctrScore;
    let frame = 0;
    const totalFrames = 40;
    const timer = setInterval(() => {
      frame++;
      const p = frame / totalFrames;
      // Ease-out
      const eased = 1 - Math.pow(1 - p, 3);
      setAnimatedScore(Math.round(eased * target * 10) / 10);
      if (frame >= totalFrames) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [ctrAnalysis]);

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
          style: data.style as StyleId,
          revisedPrompt: img.revisedPrompt,
        }),
      );
      setProgress(100);
      setSelectedImage(imgs[0] || null);
      setHistory((prev) => [...imgs, ...prev].slice(0, 20));
      setCtrAnalysis(null);
      toast.success(t('aithumbs.toast.success'));

      // Trigger blur-to-clear reveal after a tiny delay
      setTimeout(() => setImageRevealed(true), 100);

      // Auto-analyze the first image
      if (imgs[0]) {
        analyzeMutation.mutate({
          imageUrl: imgs[0].url,
          prompt: data.prompt,
        });
      }
    },
    onError: (err) => {
      setProgress(0);
      toast.error(err.message || 'Generation failed. Please try again.');
    },
  });

  const analyzeMutation = trpc.aiThumbnails.analyzeThumbnail.useMutation({
    onSuccess: (data) => {
      setCtrAnalysis(data);
      setCtrExpanded(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Thumbnail analysis failed.');
    },
  });

  const suggestIdeas = trpc.aiThumbnails.suggestIdeas.useMutation({
    onSuccess: (data) => {
      if (data.ideas.length > 0) {
        setAiIdeas(data.ideas);
      } else {
        toast.info('No ideas generated. Try a different topic.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to generate ideas. Please try again.');
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
        prompt: 'Enhanced version',
        style,
        parentId: selectedImage?.id,
      };
      setProgress(100);
      setSelectedImage(img);
      setHistory((prev) => [img, ...prev].slice(0, 20));
      setCtrAnalysis(null);
      toast.success('Image enhanced successfully!');

      setTimeout(() => setImageRevealed(true), 100);

      // Auto-analyze the enhanced image
      analyzeMutation.mutate({
        imageUrl: data.url,
        prompt: 'Enhanced version',
      });
    },
    onError: (err) => {
      setProgress(0);
      toast.error(err.message || 'Enhancement failed. Please try again.');
    },
  });

  /* ── Progress simulation ─────────────────────────── */
  const isGenerating = generate.isPending || editMutation.isPending;

  useEffect(() => {
    if (!isGenerating) return;
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 95) return p; // pause at 95 until done
        return Math.min(95, p + Math.random() * 8 + 2);
      });
    }, 500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  /* ── Handlers ───────────────────────────────────── */

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || generate.isPending) return;
    if (!canUseAI) {
      toast.error(t('aithumbs.toast.limitReached'));
      return;
    }
    const countToUse = count > 1 && plan === 'FREE' ? 1 : count;
    generate.mutate({
      prompt: prompt.trim(),
      style,
      count: countToUse,
      format,
      youtubeUrl: ytUrl || undefined,
      photoUrl: uploadedPhoto || undefined,
    });
  }, [prompt, style, count, format, plan, generate, canUseAI, t, ytUrl, uploadedPhoto]);

  const handleRegenerate = useCallback(() => {
    if (!selectedImage || generate.isPending) return;
    if (!canUseAI) { toast.error(t('aithumbs.toast.limitReached')); return; }
    generate.mutate({
      prompt: selectedImage.prompt,
      style: selectedImage.style,
      count: 1,
      format,
    });
  }, [selectedImage, generate, canUseAI, t, format]);

  const handleEnhance = useCallback(() => {
    if (!selectedImage || editMutation.isPending) return;
    if (!canUseAI) { toast.error(t('aithumbs.toast.limitReached')); return; }
    editMutation.mutate({
      imageUrl: selectedImage.url,
      instruction: 'Enhance this thumbnail: improve contrast, make colors more vibrant, increase visual impact for better CTR.',
      generationId: selectedImage.id,
    });
  }, [selectedImage, editMutation, canUseAI, t]);

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

  /* ── AI Ideas ──────────────────────────────────── */
  const handleGetIdeas = useCallback(() => {
    if (suggestIdeas.isPending) return;
    suggestIdeas.mutate({ topic: prompt.trim() || undefined });
  }, [suggestIdeas, prompt]);

  const handleCopyTitle = useCallback((title: string) => {
    navigator.clipboard.writeText(title).then(() => {
      toast.success('Title copied to clipboard!');
    }).catch(() => {
      // fallback
    });
  }, []);

  /* ── Helpers ─────────────────────────────────────── */

  const isLoading = generate.isPending;
  const isAnalyzing = analyzeMutation.isPending;
  const disabled = !prompt.trim() || !canUseAI || isLoading;

  // Suppress unused variable warnings
  void tab;
  void ytLoading;

  /* Style chip helper */
  const styleChip = useMemo(
    () =>
      (active: boolean): React.CSSProperties => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '7px 14px',
        borderRadius: 8,
        border: `1px solid ${active ? C.accent : C.border}`,
        background: active ? C.accentDim : 'transparent',
        color: active ? C.accent : C.sub,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'inherit',
        outline: 'none',
        whiteSpace: 'nowrap' as const,
      }),
    [C],
  );

  /* Score bar color */
  const scoreColor = (v: number) => {
    if (v >= 8) return C.green;
    if (v >= 6) return C.accent;
    if (v >= 4) return C.orange;
    return C.red;
  };

  /* ── Render ─────────────────────────────────────── */

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        background: C.bg,
        color: C.text,
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
          borderBottom: `1px solid ${C.border}`,
          background: C.card,
          flexShrink: 0,
          gap: 12,
        }}
      >
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
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>
            {t('aithumbs.title')}
          </span>
        </div>

        <button
          onClick={() => { window.location.href = '/thumbnails'; }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderActive; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
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
          My Works
        </button>

        {/* Credits badge */}
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 12px', borderRadius: 20,
            background: canUseAI ? C.accentDim : 'rgba(239,68,68,0.1)',
            border: `1px solid ${canUseAI ? C.accent + '26' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={canUseAI ? C.accent : C.red} strokeWidth="2.5" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: canUseAI ? C.accent : C.red }}>
            {remainingAI}
          </span>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────── */}
      <div
        style={{
          flex: 1, display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: 0, overflow: 'hidden', minHeight: 0,
        }}
      >
        {/* LEFT PANEL (380px) */}
        <div
          style={{
            width: isMobile ? '100%' : 380,
            flexShrink: 0,
            background: C.card,
            borderRight: isMobile ? 'none' : `1px solid ${C.border}`,
            borderBottom: isMobile ? `1px solid ${C.border}` : 'none',
            padding: 20,
            display: 'flex', flexDirection: 'column', gap: 14,
            overflowY: 'auto',
            maxHeight: isMobile ? 'none' : '100%',
          }}
        >
          {/* ── 1. Mode tabs: FROM SCRATCH / SWAP CHARACTER ── */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['scratch', 'swap'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setTab(m)}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 12,
                  background: tab === m ? C.surface : 'transparent',
                  border: `1px solid ${tab === m ? C.borderActive : C.border}`,
                  color: tab === m ? C.text : C.sub,
                  cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 1,
                  fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none',
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: C.accentDim,
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

          {/* ── 2. "Need an idea?" button + idea chips ────── */}
          <button
            onClick={handleGetIdeas}
            disabled={suggestIdeas.isPending}
            onMouseEnter={(e) => { if (!suggestIdeas.isPending) e.currentTarget.style.borderColor = C.accent + '60'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
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
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }}>
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
            {suggestIdeas.isPending ? 'Generating ideas...' : 'Need an idea?'}
          </button>

          {/* AI idea chips */}
          {aiIdeas.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {aiIdeas.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => { setPrompt(idea); setAiIdeas([]); }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent + '60'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.accent + '30'; }}
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

          {/* ── 3. Prompt section ──────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                Describe your idea <span style={{ color: C.accent }}>*</span>
              </span>
              <span style={{ fontSize: 11, color: prompt.length > 900 ? C.red : C.dim }}>
                {prompt.length}/1000
              </span>
            </div>

            {/* Action icons row */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {/* YouTube */}
              <SmallIconBtn
                C={C}
                active={!!ytTitle}
                onClick={() => {
                  const url = window.prompt('Enter YouTube video URL:');
                  if (url) handleYtUrl(url);
                }}
                title="Link YouTube video"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                </svg>
              </SmallIconBtn>

              {/* Upload */}
              <SmallIconBtn
                C={C}
                active={!!uploadedPhoto}
                onClick={() => fileInputRef.current?.click()}
                title="Upload photo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </SmallIconBtn>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoUpload} />

              {/* My Photos placeholder */}
              <SmallIconBtn C={C} active={false} onClick={() => toast.info('Photo gallery coming soon!')} title="My Photos">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              </SmallIconBtn>

              {/* Voice */}
              <SmallIconBtn
                C={C}
                active={isListening}
                danger={isListening}
                onClick={toggleVoice}
                title="Voice input"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                  <path d="M19 10v2a7 7 0 01-14 0v-2" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="8" y1="23" x2="16" y2="23" />
                </svg>
              </SmallIconBtn>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => { if (e.target.value.length <= 1000) setPrompt(e.target.value); }}
              placeholder={t('aithumbs.prompt.placeholder')}
              rows={4}
              style={{
                width: '100%', minHeight: 90, padding: 14,
                borderRadius: 12, border: `1px solid ${C.border}`,
                background: C.surface, color: C.text,
                fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                outline: 'none', transition: 'border-color 0.2s ease',
                boxSizing: 'border-box', lineHeight: 1.5,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = C.borderActive; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
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

          {/* Uploaded photo preview */}
          {uploadedPhoto && (
            <div style={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={uploadedPhoto} alt="Uploaded reference" style={{ width: '100%', maxHeight: 100, objectFit: 'cover', borderRadius: 10, display: 'block', border: `1px solid ${C.border}` }} />
              <button
                onClick={() => setUploadedPhoto(null)}
                style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 12, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: C.border }} />

          {/* ── 4. Settings ────────────────────────────────── */}
          {/* Style selector */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
              {t('aithumbs.section.style')}
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STYLES.map((s) => (
                <button key={s.id} onClick={() => setStyle(s.id)} style={styleChip(style === s.id)}>
                  <span style={{ fontSize: 14, lineHeight: 1 }}>{s.icon}</span> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Count & Format row */}
          <div style={{ display: 'flex', gap: 16 }}>
            {/* Count */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                Count
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
                      <span style={{ fontSize: 8, fontWeight: 800, color: C.accent, background: C.accentDim, padding: '1px 5px', borderRadius: 4, letterSpacing: 0.5, lineHeight: 1, position: 'absolute', top: -6, right: -6 }}>
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                Format
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
                    {f.icon} {f.id}
                    {f.pro && plan === 'FREE' && (
                      <span style={{ fontSize: 8, fontWeight: 800, color: C.accent, background: C.accentDim, padding: '1px 5px', borderRadius: 4, letterSpacing: 0.5, lineHeight: 1, position: 'absolute', top: -6, right: -6 }}>
                        PRO
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
              {count} credit{count > 1 ? 's' : ''}
            </span>
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* ── 5. CTA Button ──────────────────────────────── */}
          <button
            onClick={handleGenerate}
            disabled={disabled}
            aria-busy={isLoading || undefined}
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.boxShadow = `0 6px 28px ${C.accent}40`; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = disabled ? 'none' : `0 4px 20px ${C.accent}30`; }}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12,
              background: disabled ? C.border : `linear-gradient(135deg, ${C.accent}, ${C.accent}cc)`,
              color: disabled ? C.dim : '#fff',
              fontSize: 15, fontWeight: 700, border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: disabled ? 'none' : `0 4px 20px ${C.accent}30`,
              transition: 'all 0.2s ease', fontFamily: 'inherit', outline: 'none', flexShrink: 0,
            }}
          >
            {isLoading && (
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,.2)" strokeWidth="2" fill="none" />
                <path d="M9 2a7 7 0 015.2 2.33" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            )}
            {isLoading ? t('aithumbs.generating') : 'Create Magic'}
          </button>

          {/* Upgrade prompt */}
          {!canUseAI && (
            <a
              href="/billing"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px 16px', borderRadius: 12,
                background: C.accentDim, border: `1px solid ${C.accent}26`,
                color: C.accent, fontSize: 13, fontWeight: 600,
                textDecoration: 'none', textAlign: 'center', transition: 'all 0.2s ease',
              }}
            >
              {t('aithumbs.upgrade')}
            </a>
          )}
        </div>

        {/* RIGHT PANEL (flex) */}
        <div
          style={{
            flex: 1, minWidth: 0,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden', padding: 20,
          }}
        >
          {/* ── Header: Preview pill + actions ────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexShrink: 0 }}>
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '5px 14px', borderRadius: 20,
                background: C.accentDim, border: `1px solid ${C.accent}1a`,
                fontSize: 11, fontWeight: 700, color: C.accent,
                textTransform: 'uppercase', letterSpacing: 1,
              }}
            >
              PREVIEW {format}
            </span>

            <div style={{ flex: 1 }} />

            {selectedImage && !isLoading && (
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionPill
                  C={C}
                  label="Enhance"
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" /></svg>}
                  onClick={handleEnhance}
                  loading={editMutation.isPending}
                />
                <ActionPill
                  C={C}
                  label="Regenerate"
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>}
                  onClick={handleRegenerate}
                />
                <ActionPill
                  C={C}
                  label="Download"
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>}
                  onClick={() => selectedImage && handleDownload(selectedImage)}
                  accent
                />
              </div>
            )}
          </div>

          {/* ── Preview area ──────────────────────────────── */}
          <div
            style={{
              flex: 1, borderRadius: 12, background: C.card,
              border: `1px solid ${C.border}`,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', minHeight: 0,
            }}
          >
            {isGenerating ? (
              /* ── Loading animation with progress ──────── */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, position: 'relative' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: `linear-gradient(135deg, ${C.accent}33, ${C.accent}0d)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill={C.accent} opacity="0.8" />
                  </svg>
                </div>

                <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>
                  Generating... {Math.round(progress)}%
                </div>

                {/* Progress bar with percentage */}
                <div style={{ width: 240, height: 6, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.round(progress)}%`,
                    background: `linear-gradient(90deg, ${C.accent}, ${C.accent}cc)`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>

                <div style={{ fontSize: 13, color: C.dim, maxWidth: 300, textAlign: 'center', lineHeight: 1.5 }}>
                  {progress < 30 ? 'AI is composing the perfect shot...'
                    : progress < 60 ? 'Adjusting lighting and contrast...'
                    : progress < 90 ? 'Optimizing for maximum clicks...'
                    : 'Almost there, finalizing details...'}
                </div>
              </div>
            ) : selectedImage ? (
              /* ── Generated result with blur reveal ──── */
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Main image */}
                <div style={{ padding: 16, flex: 1 }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: format === '16:9' ? '16/9' : '9/16',
                    maxHeight: '60vh',
                    position: 'relative', overflow: 'hidden', borderRadius: 12,
                    background: C.bg,
                    boxShadow: `0 0 20px ${C.accent}15, 0 4px 16px rgba(0,0,0,0.3)`,
                    margin: '0 auto',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.prompt}
                      className="thumbnail-reveal-img"
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

                {/* ── CTR Score section ───────────────────── */}
                <div style={{ padding: '0 16px 16px' }}>
                  {isAnalyzing ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', borderRadius: 12,
                      background: C.surface, border: `1px solid ${C.border}`,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                        <circle cx="8" cy="8" r="6" stroke={C.accent} strokeWidth="1.5" fill="none" opacity="0.3" />
                        <path d="M8 2a6 6 0 014.24 1.76" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      </svg>
                      <span style={{ fontSize: 13, color: C.sub, fontWeight: 500 }}>Analyzing CTR potential...</span>
                    </div>
                  ) : ctrAnalysis ? (
                    <div
                      style={{
                        borderRadius: 12, border: `1px solid ${C.border}`,
                        background: C.surface, overflow: 'hidden',
                      }}
                    >
                      {/* CTR header row */}
                      <button
                        onClick={() => setCtrExpanded(!ctrExpanded)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                          padding: '12px 16px', border: 'none', background: 'transparent',
                          cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                        }}
                      >
                        {/* Score circle */}
                        <div style={{
                          width: 48, height: 48, borderRadius: 24,
                          background: `linear-gradient(135deg, ${scoreColor(animatedScore)}30, ${scoreColor(animatedScore)}10)`,
                          border: `2px solid ${scoreColor(animatedScore)}60`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <span style={{ fontSize: 18, fontWeight: 800, color: scoreColor(animatedScore) }}>
                            {animatedScore.toFixed(1)}
                          </span>
                        </div>

                        <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                            CTR SCORE
                          </div>
                          <div style={{ fontSize: 13, color: C.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ctrAnalysis.summary}
                          </div>
                        </div>

                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke={C.sub} strokeWidth="2" strokeLinecap="round"
                          style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: ctrExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {/* Expanded analytics panel */}
                      {ctrExpanded && (
                        <div style={{ borderTop: `1px solid ${C.border}` }}>
                          {/* Tab bar */}
                          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
                            {([
                              { id: 'scores' as const, label: 'Scores' },
                              { id: 'strengths' as const, label: 'Strengths' },
                              { id: 'improve' as const, label: `Improve${ctrAnalysis.improvements.length ? ` (${ctrAnalysis.improvements.length})` : ''}` },
                              { id: 'titles' as const, label: 'Titles' },
                            ]).map((at) => (
                              <button
                                key={at.id}
                                onClick={() => setAnalyticsTab(at.id)}
                                style={{
                                  flex: 1, padding: '10px 8px', border: 'none',
                                  background: 'transparent', cursor: 'pointer',
                                  fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                                  textTransform: 'uppercase', letterSpacing: '0.05em',
                                  color: analyticsTab === at.id ? C.accent : C.dim,
                                  borderBottom: analyticsTab === at.id ? `2px solid ${C.accent}` : '2px solid transparent',
                                  transition: 'all 0.15s ease', outline: 'none',
                                }}
                              >
                                {at.label}
                              </button>
                            ))}
                          </div>

                          {/* Tab content */}
                          <div style={{ padding: 16 }}>
                            {analyticsTab === 'scores' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {(['emotion', 'contrast', 'composition', 'clickability'] as const).map((key) => {
                                  const val = ctrAnalysis.scores[key];
                                  return (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                      <span style={{ width: 90, fontSize: 12, fontWeight: 600, color: C.sub, textTransform: 'capitalize' }}>
                                        {key}
                                      </span>
                                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
                                        <div style={{ width: `${val * 10}%`, height: '100%', borderRadius: 3, background: scoreColor(val), transition: 'width 0.5s ease' }} />
                                      </div>
                                      <span style={{ width: 28, fontSize: 12, fontWeight: 700, color: scoreColor(val), textAlign: 'right' }}>
                                        {val}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {analyticsTab === 'strengths' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {ctrAnalysis.strengths.map((s, i) => (
                                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <span style={{ color: C.green, fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>+</span>
                                    <span style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>{s}</span>
                                  </div>
                                ))}
                                {ctrAnalysis.strengths.length === 0 && (
                                  <span style={{ fontSize: 13, color: C.dim }}>No strengths identified.</span>
                                )}
                              </div>
                            )}

                            {analyticsTab === 'improve' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {ctrAnalysis.improvements.map((s, i) => (
                                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <span style={{ color: C.orange, fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>!</span>
                                    <span style={{ fontSize: 13, color: C.sub, lineHeight: 1.5 }}>{s}</span>
                                  </div>
                                ))}
                                {ctrAnalysis.improvements.length === 0 && (
                                  <span style={{ fontSize: 13, color: C.dim }}>No improvements needed.</span>
                                )}
                              </div>
                            )}

                            {analyticsTab === 'titles' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {ctrAnalysis.titleSuggestions.map((ts, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      padding: '10px 12px', borderRadius: 10,
                                      border: `1px solid ${C.border}`, background: C.bg,
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>
                                        {ts.title}
                                      </span>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(ts.score), background: `${scoreColor(ts.score)}15`, padding: '2px 8px', borderRadius: 10 }}>
                                        {ts.score}/10
                                      </span>
                                      <button
                                        onClick={() => handleCopyTitle(ts.title)}
                                        style={{
                                          width: 28, height: 28, borderRadius: 6,
                                          border: `1px solid ${C.border}`, background: 'transparent',
                                          color: C.sub, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          padding: 0, flexShrink: 0, transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                          <rect x="9" y="9" width="13" height="13" rx="2" />
                                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                        </svg>
                                      </button>
                                    </div>
                                    <span style={{ fontSize: 12, color: C.dim, lineHeight: 1.4 }}>{ts.reason}</span>
                                  </div>
                                ))}
                                {ctrAnalysis.titleSuggestions.length === 0 && (
                                  <span style={{ fontSize: 13, color: C.dim }}>No title suggestions available.</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* History row */}
                {history.length > 1 && (
                  <div style={{ padding: '0 16px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                      History ({history.length})
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
                              setCtrAnalysis(null);
                              analyzeMutation.mutate({ imageUrl: img.url, prompt: img.prompt });
                            }}
                            style={{
                              padding: 0, width: 80, height: 45, flexShrink: 0,
                              border: isActive ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                              borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                              background: C.bg, outline: 'none', transition: 'all 0.2s ease',
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
              /* ── Empty state ────────────────────────────── */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40 }}>
                {/* Sparkle / wand icon */}
                <div style={{ width: 80, height: 80, borderRadius: 20, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
                  </svg>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: 0 }}>
                  Create Your Thumbnail
                </h3>
                <p style={{ fontSize: 14, color: C.sub, maxWidth: 340, textAlign: 'center', margin: 0, lineHeight: 1.6 }}>
                  Describe your idea and AI will generate a click-worthy YouTube thumbnail
                </p>

                {/* Example prompt chips */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, maxWidth: 400, width: '100%' }}>
                  {EXAMPLE_PROMPTS.map((ep, i) => (
                    <button
                      key={i}
                      onClick={() => setPrompt(ep)}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent + '60'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                      style={{
                        width: '100%', padding: '10px 14px',
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        background: 'transparent',
                        color: C.sub,
                        fontSize: 13,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        outline: 'none',
                        transition: 'all 0.15s ease',
                        lineHeight: 1.4,
                      }}
                    >
                      {ep}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Premium banner ──────────────────────────── */}
          {plan === 'FREE' && (
            <div
              style={{
                marginTop: 16, padding: '14px 20px',
                borderRadius: 12, border: `1px solid ${C.accent}33`,
                background: `linear-gradient(135deg, ${C.accent}14, transparent)`,
                display: 'flex', alignItems: 'center', gap: 16,
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>
                  Want more variants, Character Mode and 9:16 for Shorts?
                </div>
                <div style={{ fontSize: 12, color: C.sub }}>
                  Upgrade to Pro for unlimited creative power.
                </div>
              </div>
              <a
                href="/billing"
                style={{
                  padding: '8px 20px', borderRadius: 8,
                  background: C.accent, color: '#fff',
                  fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Upgrade to Pro
              </a>
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
        @keyframes pulse-glow {
          0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 20px rgba(99,102,241,0.1); }
          50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 40px rgba(99,102,241,0.2); }
        }
      `}</style>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────────────── */

import type { Theme } from '@/lib/types';

function SmallIconBtn({
  C,
  active,
  danger,
  onClick,
  title,
  children,
}: {
  C: Theme;
  active: boolean;
  danger?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const borderColor = danger ? C.red : active ? C.accent + '66' : C.border;
  const bg = danger ? C.red + '1f' : active ? C.accentDim : 'transparent';
  const color = danger ? C.red : active ? C.accent : C.sub;
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={(e) => { if (!active && !danger) e.currentTarget.style.borderColor = C.borderActive; }}
      onMouseLeave={(e) => { if (!active && !danger) e.currentTarget.style.borderColor = C.border; }}
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
  C,
  label,
  icon,
  onClick,
  accent,
  loading,
}: {
  C: Theme;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  accent?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor = accent ? C.accent : C.borderActive;
          if (!accent) e.currentTarget.style.background = C.surface;
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor = accent ? C.accent + '99' : C.border;
          if (!accent) e.currentTarget.style.background = 'transparent';
        }
      }}
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
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
          <path d="M6 2a4 4 0 012.83 1.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      ) : icon}
      {label}
    </button>
  );
}
