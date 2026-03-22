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
  red: '#ff4444',
  proBadgeBg: 'rgba(200,255,0,0.12)',
  proBadgeText: '#c8ff00',
  danger: '#ef4444',
};

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

const LOADING_TIPS = [
  'AI is composing the perfect shot...',
  'Adjusting lighting and contrast...',
  'Optimizing for maximum clicks...',
  'Adding cinematic depth of field...',
  'Fine-tuning colors for small screens...',
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
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  /* AI Assistant */
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantInput, setAssistantInput] = useState('');
  const [aiIdeas, setAiIdeas] = useState<string[]>([]);

  /* CTR Analysis */
  const [ctrAnalysis, setCtrAnalysis] = useState<CTRAnalysis | null>(null);
  const [ctrExpanded, setCtrExpanded] = useState(false);
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('scores');
  const [animatedScore, setAnimatedScore] = useState(0);

  /* Loading */
  const [loadingTipIdx, setLoadingTipIdx] = useState(0);

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

  /* Loading tip rotation */
  useEffect(() => {
    const timer = setInterval(() => {
      setLoadingTipIdx((i) => (i + 1) % LOADING_TIPS.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  /* CTR score count-up animation */
  useEffect(() => {
    if (!ctrAnalysis) { setAnimatedScore(0); return; }
    const target = ctrAnalysis.ctrScore;
    let frame = 0;
    const totalFrames = 40;
    const timer = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;
      // Ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * target * 10) / 10);
      if (frame >= totalFrames) clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [ctrAnalysis]);

  /* ── tRPC mutations ─────────────────────────────── */
  const generate = trpc.aiThumbnails.generate.useMutation({
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
      setSelectedImage(imgs[0] || null);
      setHistory((prev) => [...imgs, ...prev].slice(0, 20));
      setCtrAnalysis(null);
      toast.success(t('aithumbs.toast.success'));

      // Auto-analyze the first image
      if (imgs[0]) {
        analyzeMutation.mutate({
          imageUrl: imgs[0].url,
          prompt: data.prompt,
        });
      }
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const analyzeMutation = trpc.aiThumbnails.analyzeThumbnail.useMutation({
    onSuccess: (data) => {
      setCtrAnalysis(data);
      setCtrExpanded(false);
    },
    onError: () => {
      // Silent fail for analysis — the image was still generated
    },
  });

  const suggestIdeas = trpc.aiThumbnails.suggestIdeas.useMutation({
    onSuccess: (data) => {
      if (data.ideas.length > 0) {
        setAiIdeas(data.ideas);
        setAssistantOpen(true);
      } else {
        toast.info('No ideas generated. Try a different topic.');
      }
    },
    onError: () => {
      toast.error('Failed to generate ideas. Please try again.');
    },
  });

  const editMutation = trpc.aiThumbnails.edit.useMutation({
    onSuccess: (data) => {
      const img: GeneratedImage = {
        id: data.id || uid(),
        url: data.url,
        prompt: 'Enhanced version',
        style,
        parentId: selectedImage?.id,
      };
      setSelectedImage(img);
      setHistory((prev) => [img, ...prev].slice(0, 20));
      setCtrAnalysis(null);
      toast.success('Image enhanced successfully!');

      // Auto-analyze the enhanced image
      analyzeMutation.mutate({
        imageUrl: data.url,
        prompt: 'Enhanced version',
      });
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

  /* ── AI Assistant ──────────────────────────────── */
  const handleQuickIdeas = useCallback(() => {
    if (suggestIdeas.isPending) return;
    suggestIdeas.mutate({ topic: prompt.trim() || undefined });
  }, [suggestIdeas, prompt]);

  const handleMoreVariants = useCallback(() => {
    if (suggestIdeas.isPending) return;
    suggestIdeas.mutate({ topic: prompt.trim() || undefined });
  }, [suggestIdeas, prompt]);

  const handleEnhanceIdea = useCallback(() => {
    if (!prompt.trim() || suggestIdeas.isPending) return;
    suggestIdeas.mutate({ topic: `Enhance and improve: ${prompt.trim()}` });
  }, [suggestIdeas, prompt]);

  const handleAssistantSend = useCallback(() => {
    if (!assistantInput.trim() || suggestIdeas.isPending) return;
    suggestIdeas.mutate({ topic: assistantInput.trim() });
    setAssistantInput('');
  }, [suggestIdeas, assistantInput]);

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

  /* Score bar color */
  const scoreColor = (v: number) => {
    if (v >= 8) return '#22c55e';
    if (v >= 6) return D.accent;
    if (v >= 4) return '#f59e0b';
    return D.red;
  };

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: 32, height: 32, borderRadius: 8,
              background: D.accentDim,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
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

        <button
          onClick={() => { window.location.href = '/thumbnails'; }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = D.borderActive; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = D.border; }}
          style={{
            padding: '6px 14px', borderRadius: 8,
            border: `1px solid ${D.border}`, background: 'transparent',
            color: D.sub, fontSize: 12, fontWeight: 600,
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
            background: canUseAI ? D.accentDim : 'rgba(239,68,68,0.1)',
            border: `1px solid ${canUseAI ? 'rgba(200,255,0,0.15)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={canUseAI ? D.accent : D.danger} strokeWidth="2.5" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: canUseAI ? D.accent : D.danger }}>
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
        {/* ══════════════════════════════════════════════════
            LEFT PANEL (380px)
            ══════════════════════════════════════════════════ */}
        <div
          style={{
            width: isMobile ? '100%' : 380,
            flexShrink: 0,
            background: D.bgCard,
            borderRight: isMobile ? 'none' : `1px solid ${D.border}`,
            borderBottom: isMobile ? `1px solid ${D.border}` : 'none',
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
                  background: tab === m ? D.bgInput : 'transparent',
                  border: `1px solid ${tab === m ? D.borderActive : D.border}`,
                  color: tab === m ? D.text : D.sub,
                  cursor: 'pointer', fontSize: 11, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: 1,
                  fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none',
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: D.accentDim,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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

          {/* ── 2. AI Assistant widget (collapsible) ────────── */}
          <div
            style={{
              borderRadius: 12,
              border: `1px solid ${assistantOpen ? D.accent + '30' : D.border}`,
              background: assistantOpen ? 'rgba(200,255,0,0.02)' : 'transparent',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            {/* Header */}
            <button
              onClick={() => setAssistantOpen(!assistantOpen)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', border: 'none', background: 'transparent',
                color: D.text, cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: 4,
                background: '#22c55e',
                boxShadow: '0 0 6px rgba(34,197,94,0.5)',
              }} />
              <span style={{ fontSize: 13, fontWeight: 700, flex: 1, textAlign: 'left' }}>
                AI Assistant
              </span>
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke={D.sub} strokeWidth="2" strokeLinecap="round"
                style={{
                  transition: 'transform 0.2s ease',
                  transform: assistantOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Expanded content */}
            {assistantOpen && (
              <div style={{ padding: '0 14px 14px' }}>
                {/* AI Ideas */}
                {aiIdeas.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {aiIdeas.map((idea, i) => (
                      <button
                        key={i}
                        onClick={() => { setPrompt(idea); setAssistantOpen(false); }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border: `1px solid ${D.accent}20`,
                          background: D.accentDim,
                          color: D.text,
                          fontSize: 12,
                          lineHeight: 1.5,
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          outline: 'none',
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = D.accent + '50'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = D.accent + '20'; }}
                      >
                        <span style={{ fontWeight: 700, color: D.accent, display: 'block', marginBottom: 3, fontSize: 11 }}>
                          Idea {i + 1}
                        </span>
                        <span style={{ fontStyle: 'italic', color: D.sub }}>
                          {idea.length > 120 ? idea.slice(0, 120) + '...' : idea}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                  <PillButton
                    label="Quick Ideas"
                    icon="\u26A1"
                    loading={suggestIdeas.isPending}
                    onClick={handleQuickIdeas}
                  />
                  <PillButton
                    label="More variants"
                    icon="\uD83D\uDD04"
                    loading={suggestIdeas.isPending}
                    onClick={handleMoreVariants}
                  />
                  <PillButton
                    label="Enhance"
                    icon="\uD83D\uDD25"
                    loading={suggestIdeas.isPending}
                    onClick={handleEnhanceIdea}
                    disabled={!prompt.trim()}
                  />
                </div>

                {/* Input field */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={assistantInput}
                    onChange={(e) => setAssistantInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAssistantSend(); }}
                    placeholder="Ask AI for thumbnail ideas..."
                    style={{
                      flex: 1, height: 36, padding: '0 12px',
                      borderRadius: 8, border: `1px solid ${D.border}`,
                      background: D.bgInput, color: D.text,
                      fontSize: 12, fontFamily: 'inherit', outline: 'none',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = D.borderActive; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = D.border; }}
                  />
                  <button
                    onClick={toggleVoice}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      border: `1px solid ${isListening ? D.red : D.border}`,
                      background: isListening ? 'rgba(255,68,68,0.15)' : 'transparent',
                      color: isListening ? D.red : D.sub,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, padding: 0, transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                      <path d="M19 10v2a7 7 0 01-14 0v-2" />
                    </svg>
                  </button>
                  <button
                    onClick={handleAssistantSend}
                    disabled={!assistantInput.trim() || suggestIdeas.isPending}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      border: 'none',
                      background: assistantInput.trim() ? D.accent : D.border,
                      color: assistantInput.trim() ? '#0a0a0f' : D.dim,
                      cursor: assistantInput.trim() ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, padding: 0, transition: 'all 0.2s ease',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── 3. Prompt section ──────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: D.text }}>
                Describe your idea <span style={{ color: D.accent }}>*</span>
              </span>
              <span style={{ fontSize: 11, color: prompt.length > 900 ? D.danger : D.dim }}>
                {prompt.length}/1000
              </span>
            </div>

            {/* Action icons row */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {/* YouTube */}
              <SmallIconBtn
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
              <SmallIconBtn active={false} onClick={() => toast.info('Photo gallery coming soon!')} title="My Photos">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                </svg>
              </SmallIconBtn>

              {/* Voice */}
              <SmallIconBtn
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
                borderRadius: 12, border: `1px solid ${D.border}`,
                background: D.bgInput, color: D.text,
                fontSize: 14, fontFamily: 'inherit', resize: 'vertical',
                outline: 'none', transition: 'border-color 0.2s ease',
                boxSizing: 'border-box', lineHeight: 1.5,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = D.borderActive; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = D.border; }}
            />
          </div>

          {/* YouTube title chip */}
          {ytTitle && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px', borderRadius: 10,
              background: D.accentDim, border: `1px solid rgba(200,255,0,0.12)`,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={D.accent} strokeWidth="2" strokeLinecap="round">
                <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.25 29 29 0 00-.46-5.43z" />
                <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
              <span style={{ fontSize: 12, color: D.accent, fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {ytTitle}
              </span>
              <button
                onClick={() => { setYtUrl(''); setYtTitle(null); }}
                style={{ width: 20, height: 20, borderRadius: 10, border: 'none', background: 'transparent', color: D.sub, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}
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
              <img src={uploadedPhoto} alt="Uploaded reference" style={{ width: '100%', maxHeight: 100, objectFit: 'cover', borderRadius: 10, display: 'block', border: `1px solid ${D.border}` }} />
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
          <div style={{ height: 1, background: D.border }} />

          {/* ── 4. Settings ────────────────────────────────── */}
          {/* Style selector */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: D.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
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
              <span style={{ fontSize: 11, fontWeight: 700, color: D.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                Count
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {COUNT_OPTIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCount(c as 1 | 2 | 3)}
                    style={{
                      position: 'relative', width: 40, height: 36, borderRadius: 8,
                      border: `1px solid ${count === c ? D.accent : D.border}`,
                      background: count === c ? D.accentDim : 'transparent',
                      color: count === c ? D.accent : D.sub,
                      fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none', padding: 0,
                    }}
                  >
                    {c}
                    {c > 1 && plan === 'FREE' && (
                      <span style={{ fontSize: 8, fontWeight: 800, color: D.proBadgeText, background: D.proBadgeBg, padding: '1px 5px', borderRadius: 4, letterSpacing: 0.5, lineHeight: 1, position: 'absolute', top: -6, right: -6 }}>
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: D.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                Format
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFormat(f.id)}
                    style={{
                      position: 'relative', padding: '7px 14px', borderRadius: 8,
                      border: `1px solid ${format === f.id ? D.accent : D.border}`,
                      background: format === f.id ? D.accentDim : 'transparent',
                      color: format === f.id ? D.accent : D.sub,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none',
                    }}
                  >
                    {f.icon} {f.id}
                    {f.pro && plan === 'FREE' && (
                      <span style={{ fontSize: 8, fontWeight: 800, color: D.proBadgeText, background: D.proBadgeBg, padding: '1px 5px', borderRadius: 4, letterSpacing: 0.5, lineHeight: 1, position: 'absolute', top: -6, right: -6 }}>
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Credit cost */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: D.accentDim }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={D.accent} strokeWidth="2.5" strokeLinecap="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            <span style={{ fontSize: 12, color: D.accent, fontWeight: 600 }}>
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
            onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.boxShadow = '0 6px 28px rgba(200,255,0,0.3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = disabled ? 'none' : '0 4px 20px rgba(200,255,0,0.2)'; }}
            style={{
              width: '100%', padding: '14px 0', borderRadius: 12,
              background: disabled ? D.border : 'linear-gradient(135deg, #c8ff00, #a8e600)',
              color: disabled ? D.dim : '#0a0a0f',
              fontSize: 15, fontWeight: 700, border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: disabled ? 'none' : '0 4px 20px rgba(200,255,0,0.2)',
              transition: 'all 0.2s ease', fontFamily: 'inherit', outline: 'none', flexShrink: 0,
            }}
          >
            {isLoading && (
              <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="9" cy="9" r="7" stroke="rgba(10,10,15,.2)" strokeWidth="2" fill="none" />
                <path d="M9 2a7 7 0 015.2 2.33" stroke="#0a0a0f" strokeWidth="2" strokeLinecap="round" fill="none" />
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
                background: D.accentDim, border: `1px solid rgba(200,255,0,0.15)`,
                color: D.accent, fontSize: 13, fontWeight: 600,
                textDecoration: 'none', textAlign: 'center', transition: 'all 0.2s ease',
              }}
            >
              {t('aithumbs.upgrade')}
            </a>
          )}
        </div>

        {/* ══════════════════════════════════════════════════
            RIGHT PANEL (flex)
            ══════════════════════════════════════════════════ */}
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
                background: D.accentDim, border: `1px solid rgba(200,255,0,0.1)`,
                fontSize: 11, fontWeight: 700, color: D.accent,
                textTransform: 'uppercase', letterSpacing: 1,
              }}
            >
              PREVIEW {format}
            </span>

            <div style={{ flex: 1 }} />

            {selectedImage && !isLoading && (
              <div style={{ display: 'flex', gap: 6 }}>
                <ActionPill
                  label="Enhance"
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" /></svg>}
                  onClick={handleEnhance}
                  loading={editMutation.isPending}
                />
                <ActionPill
                  label="Regenerate"
                  icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>}
                  onClick={handleRegenerate}
                />
                <ActionPill
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
              flex: 1, borderRadius: 12, background: D.bgCard,
              border: `1px solid ${D.border}`,
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden', minHeight: 0,
            }}
          >
            {isLoading ? (
              /* ── Loading animation ────────────────────── */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, position: 'relative' }}>
                <div style={{
                  width: 80, height: 80, borderRadius: 20,
                  background: `linear-gradient(135deg, ${D.accent}20, ${D.accent}05)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" fill={D.accent} opacity="0.8" />
                  </svg>
                </div>

                <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>
                  {t('aithumbs.loading.title')}
                </div>

                {/* Progress bar */}
                <div style={{ width: 200, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 2,
                    background: `linear-gradient(90deg, ${D.accent}, ${D.accent}80)`,
                    animation: 'progress-indeterminate 2s ease-in-out infinite',
                  }} />
                </div>

                {/* Rotating tip */}
                <div
                  key={loadingTipIdx}
                  style={{
                    fontSize: 13, color: 'rgba(255,255,255,0.3)',
                    maxWidth: 300, textAlign: 'center', lineHeight: 1.5,
                    animation: 'tip-fade 3s ease-in-out',
                  }}
                >
                  {LOADING_TIPS[loadingTipIdx]}
                </div>
              </div>
            ) : selectedImage ? (
              /* ── Generated result ─────────────────────── */
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {/* Main image */}
                <div className="thumbnail-reveal" style={{ padding: 16, flex: 1 }}>
                  <div style={{
                    width: '100%',
                    aspectRatio: format === '16:9' ? '16/9' : '9/16',
                    maxHeight: '60vh',
                    position: 'relative', overflow: 'hidden', borderRadius: 12,
                    background: D.bgDeep,
                    boxShadow: `0 0 20px ${D.accent}15, 0 4px 16px rgba(0,0,0,0.3)`,
                    margin: '0 auto',
                  }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedImage.url}
                      alt={selectedImage.prompt}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  </div>
                </div>

                {/* ── CTR Score section ───────────────────── */}
                <div style={{ padding: '0 16px 16px' }}>
                  {isAnalyzing ? (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '12px 16px', borderRadius: 12,
                      background: D.bgInput, border: `1px solid ${D.border}`,
                    }}>
                      <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                        <circle cx="8" cy="8" r="6" stroke={D.accent} strokeWidth="1.5" fill="none" opacity="0.3" />
                        <path d="M8 2a6 6 0 014.24 1.76" stroke={D.accent} strokeWidth="1.5" strokeLinecap="round" fill="none" />
                      </svg>
                      <span style={{ fontSize: 13, color: D.sub, fontWeight: 500 }}>Analyzing CTR potential...</span>
                    </div>
                  ) : ctrAnalysis ? (
                    <div
                      style={{
                        borderRadius: 12, border: `1px solid ${D.border}`,
                        background: D.bgInput, overflow: 'hidden',
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
                          <div style={{ fontSize: 11, fontWeight: 700, color: D.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
                            CTR SCORE
                          </div>
                          <div style={{ fontSize: 13, color: D.sub, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {ctrAnalysis.summary}
                          </div>
                        </div>

                        <svg
                          width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke={D.sub} strokeWidth="2" strokeLinecap="round"
                          style={{ flexShrink: 0, transition: 'transform 0.2s ease', transform: ctrExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {/* Expanded analytics panel */}
                      {ctrExpanded && (
                        <div style={{ borderTop: `1px solid ${D.border}` }}>
                          {/* Tab bar */}
                          <div style={{ display: 'flex', borderBottom: `1px solid ${D.border}` }}>
                            {([
                              { id: 'scores' as const, label: 'Scores' },
                              { id: 'strengths' as const, label: 'Strengths' },
                              { id: 'improve' as const, label: `Improve${ctrAnalysis.improvements.length ? ` (${ctrAnalysis.improvements.length})` : ''}` },
                              { id: 'titles' as const, label: 'Titles' },
                            ]).map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setAnalyticsTab(t.id)}
                                style={{
                                  flex: 1, padding: '10px 8px', border: 'none',
                                  background: 'transparent', cursor: 'pointer',
                                  fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                                  textTransform: 'uppercase', letterSpacing: '0.05em',
                                  color: analyticsTab === t.id ? D.accent : D.dim,
                                  borderBottom: analyticsTab === t.id ? `2px solid ${D.accent}` : '2px solid transparent',
                                  transition: 'all 0.15s ease', outline: 'none',
                                }}
                              >
                                {t.label}
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
                                      <span style={{ width: 90, fontSize: 12, fontWeight: 600, color: D.sub, textTransform: 'capitalize' }}>
                                        {key}
                                      </span>
                                      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
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
                                    <span style={{ color: '#22c55e', fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>+</span>
                                    <span style={{ fontSize: 13, color: D.sub, lineHeight: 1.5 }}>{s}</span>
                                  </div>
                                ))}
                                {ctrAnalysis.strengths.length === 0 && (
                                  <span style={{ fontSize: 13, color: D.dim }}>No strengths identified.</span>
                                )}
                              </div>
                            )}

                            {analyticsTab === 'improve' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {ctrAnalysis.improvements.map((s, i) => (
                                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                                    <span style={{ color: '#f59e0b', fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>!</span>
                                    <span style={{ fontSize: 13, color: D.sub, lineHeight: 1.5 }}>{s}</span>
                                  </div>
                                ))}
                                {ctrAnalysis.improvements.length === 0 && (
                                  <span style={{ fontSize: 13, color: D.dim }}>No improvements needed.</span>
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
                                      border: `1px solid ${D.border}`, background: D.bgDeep,
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                      <span style={{ fontSize: 14, fontWeight: 700, color: D.text, flex: 1 }}>
                                        {ts.title}
                                      </span>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: scoreColor(ts.score), background: `${scoreColor(ts.score)}15`, padding: '2px 8px', borderRadius: 10 }}>
                                        {ts.score}/10
                                      </span>
                                      <button
                                        onClick={() => handleCopyTitle(ts.title)}
                                        style={{
                                          width: 28, height: 28, borderRadius: 6,
                                          border: `1px solid ${D.border}`, background: 'transparent',
                                          color: D.sub, cursor: 'pointer',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                                          padding: 0, flexShrink: 0, transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = D.accent; e.currentTarget.style.color = D.accent; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.color = D.sub; }}
                                      >
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                          <rect x="9" y="9" width="13" height="13" rx="2" />
                                          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                        </svg>
                                      </button>
                                    </div>
                                    <span style={{ fontSize: 12, color: D.dim, lineHeight: 1.4 }}>{ts.reason}</span>
                                  </div>
                                ))}
                                {ctrAnalysis.titleSuggestions.length === 0 && (
                                  <span style={{ fontSize: 13, color: D.dim }}>No title suggestions available.</span>
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
                    <span style={{ fontSize: 11, fontWeight: 700, color: D.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
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
                              setCtrAnalysis(null);
                              analyzeMutation.mutate({ imageUrl: img.url, prompt: img.prompt });
                            }}
                            style={{
                              padding: 0, width: 80, height: 45, flexShrink: 0,
                              border: isActive ? `2px solid ${D.accent}` : `1px solid ${D.border}`,
                              borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                              background: D.bgDeep, outline: 'none', transition: 'all 0.2s ease',
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
                <div style={{ width: 80, height: 80, borderRadius: 20, background: D.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={D.accent + '55'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
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

          {/* ── Premium banner ──────────────────────────── */}
          {plan === 'FREE' && (
            <div
              style={{
                marginTop: 16, padding: '14px 20px',
                borderRadius: 12, border: `1px solid ${D.accent}20`,
                background: `linear-gradient(135deg, ${D.accent}08, transparent)`,
                display: 'flex', alignItems: 'center', gap: 16,
                flexShrink: 0,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: D.text, marginBottom: 2 }}>
                  Want more variants, Character Mode and 9:16 for Shorts?
                </div>
                <div style={{ fontSize: 12, color: D.sub }}>
                  Upgrade to Pro for unlimited creative power.
                </div>
              </div>
              <a
                href="/billing"
                style={{
                  padding: '8px 20px', borderRadius: 8,
                  background: D.accent, color: '#0a0a0f',
                  fontSize: 12, fontWeight: 700, textDecoration: 'none',
                  whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = D.accentHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = D.accent; }}
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
          0%, 100% { transform: scale(1); opacity: 0.8; box-shadow: 0 0 20px rgba(200,255,0,0.1); }
          50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 40px rgba(200,255,0,0.2); }
        }
        @keyframes progress-indeterminate {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 60%; margin-left: 20%; }
          100% { width: 0%; margin-left: 100%; }
        }
        @keyframes tip-fade {
          0% { opacity: 0; transform: translateY(8px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .thumbnail-reveal {
          animation: thumbnail-fade-in 0.5s ease-out both;
        }
        @keyframes thumbnail-fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
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
  const borderColor = danger ? D.red : active ? D.accent + '40' : D.border;
  const bg = danger ? 'rgba(255,68,68,0.12)' : active ? D.accentDim : 'transparent';
  const color = danger ? D.red : active ? D.accent : D.sub;
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={(e) => { if (!active && !danger) e.currentTarget.style.borderColor = D.borderActive; }}
      onMouseLeave={(e) => { if (!active && !danger) e.currentTarget.style.borderColor = D.border; }}
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

function PillButton({
  label,
  icon,
  loading,
  onClick,
  disabled,
}: {
  label: string;
  icon: string;
  loading: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  const isDisabled = loading || disabled;
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.borderColor = D.accent + '50'; }}
      onMouseLeave={(e) => { if (!isDisabled) e.currentTarget.style.borderColor = D.border; }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '5px 10px', borderRadius: 8,
        border: `1px solid ${D.border}`, background: 'transparent',
        color: isDisabled ? D.dim : D.sub,
        fontSize: 11, fontWeight: 600, cursor: isDisabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit', transition: 'all 0.15s ease', outline: 'none',
        whiteSpace: 'nowrap',
        opacity: isDisabled ? 0.5 : 1,
      }}
    >
      {loading ? (
        <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: 'spin 1s linear infinite' }}>
          <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
          <path d="M6 2a4 4 0 012.83 1.17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      ) : (
        <span style={{ fontSize: 12 }}>{icon}</span>
      )}
      {label}
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
  return (
    <button
      onClick={onClick}
      disabled={loading}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor = accent ? D.accent : D.borderActive;
          if (!accent) e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        }
      }}
      onMouseLeave={(e) => {
        if (!loading) {
          e.currentTarget.style.borderColor = accent ? D.accent + '60' : D.border;
          if (!accent) e.currentTarget.style.background = 'transparent';
        }
      }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 8,
        border: `1px solid ${accent ? D.accent + '60' : D.border}`,
        background: accent ? D.accentDim : 'transparent',
        color: accent ? D.accent : D.text,
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
