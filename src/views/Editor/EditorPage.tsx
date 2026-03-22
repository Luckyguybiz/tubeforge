'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useEditorStore, MUSIC_TRACKS } from '@/stores/useEditorStore';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { OnlineUsers } from '@/components/ui/OnlineUsers';
import { SceneLockIndicator } from '@/components/ui/SceneLockIndicator';
import { MODELS } from '@/lib/constants';
import { fmtDur } from '@/lib/utils';
import { useProjectSync } from '@/hooks/useProjectSync';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';
import { useCollaboration, useSceneEditLock } from '@/hooks/useCollaboration';
import { useUndoHint } from '@/hooks/useUndoHint';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import type { Theme, Scene, TransitionType } from '@/lib/types';
import { trackEvent } from '@/lib/analytics-events';

/* ═══════════════════════════════════════════════════════════════════
   ANIMATION STYLES DATA
   ═══════════════════════════════════════════════════════════════════ */
interface AnimationStyle {
  id: string;
  name: string;
  category: string;
  badge: string | null;
  gradient: [string, string];
}

const ANIMATION_STYLES: AnimationStyle[] = [
  { id: 'general', name: 'GENERAL', category: 'all', badge: 'Top Choice', gradient: ['#6366f1', '#8b5cf6'] },
  { id: '3d-cats', name: '3D CATS', category: '3d', badge: 'Trending', gradient: ['#f59e0b', '#ef4444'] },
  { id: 'anime-2d', name: 'ANIME 2D', category: 'anime', badge: 'Top Choice', gradient: ['#ec4899', '#8b5cf6'] },
  { id: 'cartoon-style', name: 'CARTOON', category: 'cartoon', badge: 'New', gradient: ['#22c55e', '#06b6d4'] },
  { id: 'realistic', name: 'REALISTIC', category: 'realistic', badge: 'Top Choice', gradient: ['#3b82f6', '#1d4ed8'] },
  { id: 'meme-anim', name: 'MEME ANIMATION', category: 'meme', badge: 'Trending', gradient: ['#f97316', '#eab308'] },
  { id: 'story-anim', name: 'STORY ANIMATION', category: 'story', badge: null, gradient: ['#8b5cf6', '#6366f1'] },
  { id: 'cute-animals', name: 'CUTE ANIMALS', category: 'cats', badge: 'Top Choice', gradient: ['#f472b6', '#fb923c'] },
  { id: 'product-anim', name: 'PRODUCT ANIMATION', category: 'all', badge: null, gradient: ['#0ea5e9', '#6366f1'] },
  { id: 'educational', name: 'EDUCATIONAL', category: 'all', badge: null, gradient: ['#14b8a6', '#22d3ee'] },
  { id: 'face-punch', name: 'FACE PUNCH', category: 'effects', badge: 'Top Choice', gradient: ['#ef4444', '#dc2626'] },
  { id: 'earth-zoom', name: 'EARTH ZOOM OUT', category: 'effects', badge: null, gradient: ['#3b82f6', '#06b6d4'] },
  { id: 'eyes-in', name: 'EYES IN', category: 'effects', badge: 'Mixed', gradient: ['#a855f7', '#6366f1'] },
  { id: 'metal-melt', name: 'TURNING METAL X MELTING', category: 'effects', badge: 'Top Choice', gradient: ['#78716c', '#a8a29e'] },
  { id: 'building-explosion', name: 'BUILDING EXPLOSION', category: 'effects', badge: null, gradient: ['#f97316', '#ef4444'] },
  { id: 'clone-explosion', name: 'CLONE EXPLOSION', category: 'effects', badge: null, gradient: ['#6366f1', '#ec4899'] },
  { id: 'roll-transition', name: 'ROLL TRANSITION', category: 'effects', badge: 'Mixed', gradient: ['#14b8a6', '#06b6d4'] },
  { id: 'fpv-drone', name: 'FPV DRONE', category: 'effects', badge: null, gradient: ['#0ea5e9', '#3b82f6'] },
  { id: 'crash-zoom', name: 'CRASH ZOOM IN', category: 'effects', badge: null, gradient: ['#eab308', '#f59e0b'] },
  { id: 'dolly-zoom', name: 'DOLLY ZOOM IN', category: 'effects', badge: null, gradient: ['#22c55e', '#16a34a'] },
  { id: 'freezing', name: 'FREEZING', category: 'effects', badge: null, gradient: ['#06b6d4', '#67e8f9'] },
  { id: 'disintegration', name: 'DISINTEGRATION', category: 'effects', badge: null, gradient: ['#a855f7', '#c084fc'] },
  { id: 'head-explosion', name: 'HEAD EXPLOSION', category: 'effects', badge: null, gradient: ['#ef4444', '#f97316'] },
  { id: 'glowing-fish', name: 'GLOWING FISH', category: 'effects', badge: null, gradient: ['#06b6d4', '#22d3ee'] },
];

interface StyleCategory {
  id: string;
  label: string;
}

const STYLE_CATEGORIES: StyleCategory[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'trending', label: 'Trending' },
  { id: 'effects', label: 'Effects' },
  { id: '3d', label: '3D Animation' },
  { id: 'anime', label: 'Anime' },
  { id: 'cartoon', label: 'Cartoon' },
  { id: 'cats', label: 'Cats' },
  { id: 'realistic', label: 'Realistic' },
  { id: 'meme', label: 'Meme Style' },
  { id: 'story', label: 'Story Animation' },
];


/* ═══════════════════════════════════════════════════════════════════
   FRAME UPLOAD SLOT
   ═══════════════════════════════════════════════════════════════════ */
interface FrameSlotProps {
  label: string;
  value: string | null;
  C: Theme;
  accentCol: string;
  onChange: (dataUrl: string | null) => void;
  optional?: boolean;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];

function FrameSlot({ label, value, C, accentCol, onChange, optional }: FrameSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setError(null);

      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        setError(useLocaleStore.getState().t('editor.frame.invalidFormat'));
        e.target.value = '';
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        setError(useLocaleStore.getState().t('editor.frame.maxSize'));
        e.target.value = '';
        return;
      }

      setIsLoading(true);
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result as string);
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError(useLocaleStore.getState().t('editor.frame.readError'));
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [onChange],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setError(null);

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError(useLocaleStore.getState().t('editor.frame.invalidFormat'));
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError(useLocaleStore.getState().t('editor.frame.maxSize'));
      return;
    }

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      onChange(reader.result as string);
      setIsLoading(false);
    };
    reader.onerror = () => {
      setError(useLocaleStore.getState().t('editor.frame.readError'));
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: C.sub, textTransform: 'uppercase', letterSpacing: '.03em' }}>
        {label}
      </span>
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          width: '100%',
          height: 80,
          borderRadius: 12,
          border: value ? `1.5px solid ${accentCol}30` : `1.5px dashed ${C.border}`,
          background: value ? 'transparent' : C.bg,
          position: 'relative',
          cursor: 'pointer',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color .15s, background .15s',
        }}
        onClick={() => {
          if (!value && !isLoading) inputRef.current?.click();
        }}
        onMouseEnter={(e) => {
          if (!value) {
            (e.currentTarget as HTMLElement).style.borderColor = accentCol + '55';
            (e.currentTarget as HTMLElement).style.background = accentCol + '06';
          }
        }}
        onMouseLeave={(e) => {
          if (!value) {
            (e.currentTarget as HTMLElement).style.borderColor = C.border;
            (e.currentTarget as HTMLElement).style.background = C.bg;
          }
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <span
              style={{
                width: 18, height: 18, borderRadius: '50%',
                border: `2px solid ${accentCol}33`, borderTopColor: accentCol,
                animation: 'spin .8s linear infinite', display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 8, color: C.dim, fontWeight: 500 }}>{useLocaleStore.getState().t('editor.frame.loading')}</span>
          </div>
        ) : value ? (
          <>
            <img src={value} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
            <button
              onClick={(e) => { e.stopPropagation(); onChange(null); setError(null); }}
              style={{
                position: 'absolute', top: 3, right: 3, width: 18, height: 18,
                borderRadius: 5, border: 'none', background: 'rgba(0,0,0,.55)',
                color: C.text, fontSize: 10, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                lineHeight: 1, backdropFilter: 'blur(4px)', transition: 'background .15s',
              }}
              title={useLocaleStore.getState().t('editor.frame.remove')}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(220,50,50,.75)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.55)'; }}
            >
              &#10005;
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              style={{
                position: 'absolute', bottom: 3, right: 3, width: 18, height: 18,
                borderRadius: 5, border: 'none', background: 'rgba(0,0,0,.45)',
                color: C.text, fontSize: 9, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
                lineHeight: 1, backdropFilter: 'blur(4px)', transition: 'background .15s',
              }}
              title={useLocaleStore.getState().t('editor.frame.replace')}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.7)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,.45)'; }}
            >
              &#8635;
            </button>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span style={{ fontSize: 22, color: error ? C.accent : C.dim, lineHeight: 1 }}>{error ? '!' : '+'}</span>
            <span style={{ fontSize: 8, color: error ? C.accent : C.dim, fontWeight: 500, textAlign: 'center', padding: '0 4px' }}>
              {error || (optional ? 'Optional' : useLocaleStore.getState().t('editor.frame.upload'))}
            </span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STYLE CARD — for the gallery grid
   ═══════════════════════════════════════════════════════════════════ */
interface StyleCardProps {
  style: AnimationStyle;
  isSelected: boolean;
  C: Theme;
  onSelect: (id: string) => void;
}

const StyleCard = memo(function StyleCard({ style: s, isSelected, C, onSelect }: StyleCardProps) {
  const badgeColor = s.badge === 'Top Choice'
    ? { bg: '#c8ff0022', text: '#c8ff00', border: '#c8ff0044' }
    : s.badge === 'New'
      ? { bg: C.accent + '22', text: C.accent, border: C.accent + '44' }
      : s.badge === 'Trending'
        ? { bg: '#f59e0b22', text: '#f59e0b', border: '#f59e0b44' }
        : s.badge === 'Mixed'
          ? { bg: C.dim + '22', text: C.sub, border: C.border }
          : null;

  return (
    <div
      className="style-card"
      onClick={() => onSelect(s.id)}
      style={{
        borderRadius: 12,
        background: `linear-gradient(135deg, ${s.gradient[0]}, ${s.gradient[1]})`,
        border: isSelected ? '2px solid #c8ff00' : '2px solid transparent',
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '10px 10px 10px',
        minHeight: 100,
        transition: 'transform .15s ease, border-color .15s ease, box-shadow .15s ease',
        boxShadow: isSelected ? '0 0 16px #c8ff0033' : 'none',
      }}
    >
      {badgeColor && s.badge && (
        <span style={{
          position: 'absolute', top: 6, right: 6,
          fontSize: 8, fontWeight: 700, padding: '2px 6px',
          borderRadius: 4, background: badgeColor.bg,
          color: badgeColor.text, border: `1px solid ${badgeColor.border}`,
          textTransform: 'uppercase', letterSpacing: '0.03em',
          backdropFilter: 'blur(4px)',
        }}>
          {s.badge}
        </span>
      )}
      <span style={{
        fontSize: 11, fontWeight: 800, color: '#fff',
        textTransform: 'uppercase', letterSpacing: '0.04em',
        textShadow: '0 1px 4px rgba(0,0,0,.4)',
        lineHeight: 1.2,
      }}>
        {s.name}
      </span>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   SKELETON LOADERS
   ═══════════════════════════════════════════════════════════════════ */
function EditorSkeleton({ C }: { C: Theme }) {
  return (
    <div style={{ display: 'flex', height: '100dvh', background: C.bg, overflow: 'hidden' }}>
      <div style={{ width: 380, flexShrink: 0, background: C.card, borderRight: `1px solid ${C.border}`, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Skeleton width="100%" height={80} style={{ borderRadius: 12 }} />
        <div style={{ display: 'flex', gap: 10 }}>
          <Skeleton width="50%" height={80} style={{ borderRadius: 12 }} />
          <Skeleton width="50%" height={80} style={{ borderRadius: 12 }} />
        </div>
        <Skeleton width="100%" height={100} style={{ borderRadius: 12 }} />
        <Skeleton width="100%" height={48} style={{ borderRadius: 12 }} />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 20 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <Skeleton width={140} height={32} style={{ borderRadius: 8 }} />
          <Skeleton width={140} height={32} style={{ borderRadius: 8 }} />
        </div>
        <Skeleton width="100%" height="100%" style={{ borderRadius: 12, flex: 1 }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN EDITOR PAGE
   ═══════════════════════════════════════════════════════════════════ */
export function EditorPage({ projectId = null }: { projectId?: string | null }) {
  const sync = useProjectSync(projectId);
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { canUseAI, remainingAI, plan } = usePlanLimits();

  const scenes = useEditorStore((s) => s.scenes);
  const selId = useEditorStore((s) => s.selId);
  const setSelId = useEditorStore((s) => s.setSelId);
  const confirmDel = useEditorStore((s) => s.confirmDel);
  const setConfirmDel = useEditorStore((s) => s.setConfirmDel);
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const autoSaveDirty = useEditorStore((s) => s.autoSaveDirty);
  const musicTrackId = useEditorStore((s) => s.musicTrackId);
  const musicVolume = useEditorStore((s) => s.musicVolume);

  // Real-time collaboration
  useCollaboration(projectId);
  useSceneEditLock(selId);

  // UI state
  const [selectedStyleId, setSelectedStyleId] = useState('general');
  const [activeCategory, setActiveCategory] = useState('all');
  const [styleSearch, setStyleSearch] = useState('');
  const [durationValue, setDurationValue] = useState(5);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('720p');
  const [rightPanelTab, setRightPanelTab] = useState<'howto' | 'history' | 'styles'>('howto');

  // AI ideas
  const [aiIdeas, setAiIdeas] = useState<string[]>([]);

  // Scene management state
  const [leftModelsOpen, setLeftModelsOpen] = useState(false);
  const leftModDropRef = useRef<HTMLDivElement>(null);

  // Modals
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [scriptTopic, setScriptTopic] = useState('');
  const [scriptTone, setScriptTone] = useState<'professional' | 'casual' | 'fun'>('professional');
  const [scriptDuration, setScriptDuration] = useState<'30s' | '1min' | '3min'>('1min');
  const [showCaptionsModal, setShowCaptionsModal] = useState(false);
  const [captionsSrt, setCaptionsSrt] = useState<string | null>(null);
  const [showShortsModal, setShowShortsModal] = useState(false);

  // Progress & result
  const [showResult, setShowResult] = useState(false);
  const [videoRevealed, setVideoRevealed] = useState(false);

  const musicAudioRef = useRef<HTMLAudioElement | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);

  // Video generation hook for selected scene
  const videoGen = useVideoGeneration(selId);

  // AI Ideas mutation
  const suggestIdeas = trpc.aiThumbnails.suggestIdeas.useMutation({
    onSuccess: (data) => {
      if (data.ideas.length > 0) {
        setAiIdeas(data.ideas);
      } else {
        toast.info('No ideas generated. Try a different topic.');
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to generate ideas.');
    },
  });

  // Z1: AI Script Generator mutation
  const generateScript = trpc.ai.generateScript.useMutation({
    onSuccess: (data) => {
      const store = useEditorStore.getState();
      data.scenes.forEach((s: { text: string; duration: number }) => {
        const newScene = store.addScene();
        store.updScene(newScene.id, {
          prompt: s.text,
          duration: s.duration,
          status: 'editing',
          label: s.text.slice(0, 30) + (s.text.length > 30 ? '...' : ''),
        });
        if (projectId) {
          sync.updateScene(newScene.id, { prompt: s.text, duration: s.duration, label: s.text.slice(0, 30) });
        }
      });
      setShowScriptModal(false);
      setScriptTopic('');
      toast.success(t('editor.script.generated') + data.scenes.length);
      trackEvent('ai_script_generated', { tone: scriptTone, duration: scriptDuration, scenesCount: data.scenes.length });
    },
    onError: (err) => toast.error(err.message),
  });

  // Z2: AI Captions mutation
  const generateCaptions = trpc.ai.generateCaptions.useMutation({
    onSuccess: (data) => {
      setCaptionsSrt(data.srt);
      setShowCaptionsModal(true);
      toast.success(t('editor.captions.generated'));
    },
    onError: (err) => toast.error(err.message),
  });

  // Suppress unused variable warnings
  void generateCaptions;

  // Auto-save
  useEffect(() => {
    if (!projectId) return;
    const handler = () => {
      const store = useEditorStore.getState();
      store.scenes.forEach((sc) => {
        sync.updateScene(sc.id, { prompt: sc.prompt, label: sc.label, duration: sc.duration });
      });
    };
    window.addEventListener('tf-autosave', handler);
    return () => {
      window.removeEventListener('tf-autosave', handler);
      useEditorStore.getState().clearAutoSaveTimer();
    };
  }, [projectId, sync]);

  // Background music playback
  useEffect(() => {
    if (!musicTrackId) {
      if (musicAudioRef.current) { musicAudioRef.current.pause(); musicAudioRef.current = null; }
      return;
    }
    const track = MUSIC_TRACKS.find((t) => t.id === musicTrackId);
    if (!track) return;
    if (!musicAudioRef.current || musicAudioRef.current.src !== track.url) {
      if (musicAudioRef.current) musicAudioRef.current.pause();
      const audio = new Audio(track.url);
      audio.loop = true;
      audio.volume = musicVolume / 100;
      audio.play().catch(() => {/* autoplay blocked */});
      musicAudioRef.current = audio;
    } else {
      musicAudioRef.current.volume = musicVolume / 100;
    }
  }, [musicTrackId, musicVolume]);

  useEffect(() => {
    return () => {
      if (musicAudioRef.current) { musicAudioRef.current.pause(); musicAudioRef.current = null; }
    };
  }, []);

  useEffect(() => {
    if (!leftModelsOpen) return;
    const handler = (e: MouseEvent) => {
      if (leftModDropRef.current && !leftModDropRef.current.contains(e.target as Node)) setLeftModelsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [leftModelsOpen]);

  // Sync wrappers
  const updScene = useCallback((id: string, patch: Partial<Scene>) => {
    if (projectId) { sync.updateScene(id, patch); } else { useEditorStore.getState().updScene(id, patch); }
    useEditorStore.getState().markDirty();
  }, [projectId, sync]);

  const addScene = useCallback((afterId?: string) => {
    if (projectId) { sync.addScene(afterId); } else { useEditorStore.getState().addScene(afterId); }
  }, [projectId, sync]);

  const delScene = useCallback((id: string) => {
    if (projectId) { sync.deleteScene(id); } else { useEditorStore.getState().delScene(id); }
  }, [projectId, sync]);

  const handleGenerate = useCallback(() => {
    const store = useEditorStore.getState();
    const currentSel = store.scenes.find((s) => s.id === store.selId);
    if (!currentSel || !currentSel.prompt.trim() || videoGen.isGenerating) return;
    if (!canUseAI) { toast.error('AI credits exhausted. Upgrade your plan.'); return; }

    const activeStyle = ANIMATION_STYLES.find((s) => s.id === selectedStyleId);
    const stylePrefix = activeStyle ? `[Style: ${activeStyle.name}] ` : '';
    const fullPrompt = stylePrefix + currentSel.prompt;

    trackEvent('video_generate', { model: currentSel.model, duration: currentSel.duration, style: selectedStyleId });
    videoGen.start(fullPrompt, currentSel.model, currentSel.duration);
  }, [videoGen, selectedStyleId, canUseAI]);

  // Keyboard shortcut: Ctrl+Enter to generate
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleGenerate();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleGenerate]);

  // Undo / Redo
  const historyLen = useEditorStore((s) => s.historyCount);
  const futureLen = useEditorStore((s) => s.futureCount);
  useUndoHint(historyLen);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const es = useEditorStore.getState();
        if (es.historyCount > 0) {
          es.undo();
          useNotificationStore.getState().addToast('info', useLocaleStore.getState().t('editor.actionUndone'), 1500);
        }
      }
      if ((e.ctrlKey || e.metaKey) && ((e.key === 'z' && e.shiftKey) || e.key === 'y')) {
        e.preventDefault();
        const es = useEditorStore.getState();
        if (es.futureCount > 0) {
          es.redo();
          useNotificationStore.getState().addToast('info', useLocaleStore.getState().t('editor.actionRedone'), 1500);
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (!confirmDel) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setConfirmDel(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [confirmDel, setConfirmDel]);

  const autoResize = useCallback((el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    const maxH = 160;
    const sh = el.scrollHeight;
    el.style.height = Math.max(80, Math.min(sh, maxH)) + 'px';
    el.style.overflowY = sh > maxH ? 'auto' : 'hidden';
  }, []);

  // AI Ideas handler
  const handleGetIdeas = useCallback(() => {
    if (suggestIdeas.isPending) return;
    const currentPrompt = useEditorStore.getState().scenes.find((s) => s.id === useEditorStore.getState().selId)?.prompt || '';
    suggestIdeas.mutate({ topic: currentPrompt.trim() || undefined });
  }, [suggestIdeas]);

  /* --- Computed --- */
  const gc = useCallback((k: string) => (C[k as keyof Theme] as string) || C.accent, [C]);
  const sel = useMemo(() => scenes.find((s) => s.id === selId), [scenes, selId]);

  const isGenerating = videoGen.isGenerating;
  const progress = videoGen.progress;

  const selectedStyle = useMemo(() => ANIMATION_STYLES.find((s) => s.id === selectedStyleId) || ANIMATION_STYLES[0], [selectedStyleId]);
  const selCol = sel ? gc(sel.ck) : C.accent;
  const selMod = sel ? (MODELS.find((m) => m.id === sel.model) || MODELS[1]) : MODELS[1];

  // Filter styles based on category and search
  const filteredStyles = useMemo(() => {
    let styles = ANIMATION_STYLES;
    if (activeCategory === 'new') {
      styles = styles.filter((s) => s.badge === 'New');
    } else if (activeCategory === 'trending') {
      styles = styles.filter((s) => s.badge === 'Trending');
    } else if (activeCategory !== 'all') {
      styles = styles.filter((s) => s.category === activeCategory);
    }
    if (styleSearch.trim()) {
      const q = styleSearch.toLowerCase();
      styles = styles.filter((s) => s.name.toLowerCase().includes(q) || s.category.includes(q));
    }
    return styles;
  }, [activeCategory, styleSearch]);

  const handleStyleSelect = useCallback((id: string) => {
    setSelectedStyleId(id);
    setRightPanelTab('howto');
  }, []);

  const disabled = !sel?.prompt?.trim() || !canUseAI || isGenerating;

  /* ═══════════════════════════════════════════════════════════════
     MOBILE FALLBACK
     ═══════════════════════════════════════════════════════════════ */
  if (isMobile) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '100dvh', padding: 24,
        textAlign: 'center', background: C.bg,
      }}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <line x1="8" y1="21" x2="16" y2="21" />
          <line x1="12" y1="17" x2="12" y2="21" />
        </svg>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, margin: '16px 0 8px' }}>
          {t('editor.mobileTitle')}
        </h2>
        <p style={{ fontSize: 14, color: C.sub, maxWidth: 300, lineHeight: 1.5 }}>
          {t('editor.mobileDesc')}
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            marginTop: 20, padding: '12px 24px', borderRadius: 12,
            border: 'none', background: C.accent, color: C.text,
            fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {t('editor.backToDashboard')}
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LOADING STATE
     ═══════════════════════════════════════════════════════════════ */
  if (projectId && sync.isLoading) {
    return <EditorSkeleton C={C} />;
  }

  /* ═══════════════════════════════════════════════════════════════
     ERROR STATE (only when projectId is set)
     ═══════════════════════════════════════════════════════════════ */
  if (projectId && sync.isError) {
    return (
      <div style={{ display: 'flex', height: '100dvh', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 40 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accent + '12', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: C.accent }}>!</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t('editor.loadError')}</div>
          <div style={{ fontSize: 12, color: C.sub, textAlign: 'center', maxWidth: 280 }}>{t('editor.loadErrorHint')}</div>
          <button
            onClick={() => sync.refetch()}
            style={{
              marginTop: 4, padding: '9px 24px', borderRadius: 10,
              border: 'none', background: C.accent, color: C.text,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {t('editor.retry')}
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     MAIN RENDER
     Layout: 1:1 match with AiThumbnailsPage
     ═══════════════════════════════════════════════════════════════ */
  const ACCENT_LIME = '#c8ff00';

  return (
    <div
      style={{
        background: C.bg,
        color: C.text,
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
        {/* ── Top Bar (same as AiThumbnails) ─────────────── */}
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
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text, whiteSpace: 'nowrap' }}>
              Video Editor
            </span>
            <OnlineUsers />
          </div>

          {/* Save status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {autoSaveDirty ? (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.orange, flexShrink: 0 }} title={t('editor.autoSave.unsaved')} />
            ) : saveStatus === 'saved' ? (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, flexShrink: 0, opacity: 0.7 }} title={t('editor.autoSave.saved')} />
            ) : saveStatus === 'saving' ? (
              <span style={{ width: 6, height: 6, borderRadius: '50%', border: '1.5px solid transparent', borderTopColor: C.dim, animation: 'spin .8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
            ) : null}
          </div>

          {/* Undo/Redo */}
          <div style={{ display: 'flex', gap: 2 }}>
            <button
              onClick={() => { const es = useEditorStore.getState(); if (es.historyCount > 0) es.undo(); }}
              disabled={historyLen === 0}
              title={`${t('editor.toolbar.undo')} (Ctrl+Z)`}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: historyLen === 0 ? C.dim : C.sub, fontSize: 14,
                cursor: historyLen === 0 ? 'default' : 'pointer',
                fontFamily: 'inherit', opacity: historyLen === 0 ? 0.3 : 1,
                transition: 'all .15s', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
            >
              &#8617;
            </button>
            <button
              onClick={() => { const es = useEditorStore.getState(); if (es.futureCount > 0) es.redo(); }}
              disabled={futureLen === 0}
              title={`${t('editor.toolbar.redo')} (Ctrl+Shift+Z)`}
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: `1px solid ${C.border}`, background: 'transparent',
                color: futureLen === 0 ? C.dim : C.sub, fontSize: 14,
                cursor: futureLen === 0 ? 'default' : 'pointer',
                fontFamily: 'inherit', opacity: futureLen === 0 ? 0.3 : 1,
                transition: 'all .15s', display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: 0,
              }}
            >
              &#8618;
            </button>
          </div>

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
            flexDirection: 'row',
            gap: 0, overflow: 'hidden', minHeight: 0,
          }}
        >
          {/* LEFT PANEL (380px) — same width as AiThumbnails */}
          <div
            style={{
              width: 380,
              flexShrink: 0,
              background: C.card,
              borderRight: `1px solid ${C.border}`,
              padding: 20,
              display: 'flex', flexDirection: 'column', gap: 14,
              overflowY: 'auto',
              maxHeight: '100%',
            }}
          >
            {/* ── 1. Style Preview Card (clickable to open styles) ── */}
            <div
              onClick={() => setRightPanelTab('styles')}
              style={{
                borderRadius: 12,
                background: `linear-gradient(135deg, ${selectedStyle.gradient[0]}, ${selectedStyle.gradient[1]})`,
                padding: '16px 14px 14px',
                position: 'relative',
                minHeight: 80,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-end',
                cursor: 'pointer',
                transition: 'transform .15s ease, box-shadow .15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,.2)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <span
                style={{
                  position: 'absolute', top: 8, right: 8,
                  fontSize: 9, fontWeight: 600, color: '#ffffffcc',
                  background: 'rgba(0,0,0,.3)', border: 'none',
                  borderRadius: 6, padding: '4px 8px',
                  backdropFilter: 'blur(4px)',
                }}
              >
                Change
              </span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.04em', textShadow: '0 1px 4px rgba(0,0,0,.3)' }}>
                {selectedStyle.name}
              </span>
              <span style={{ fontSize: 10, color: '#ffffffaa', marginTop: 2, fontWeight: 500 }}>
                {selMod.icon} {selMod.name}
              </span>
            </div>

            {/* ── 2. Frame upload slots ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <FrameSlot
                label={t('editor.frame.startFrame')}
                value={sel?.sf ?? null}
                C={C}
                accentCol={selCol}
                onChange={(v) => { if (sel) updScene(sel.id, { sf: v }); }}
              />
              <FrameSlot
                label={t('editor.frame.endFrame')}
                value={sel?.ef ?? null}
                C={C}
                accentCol={selCol}
                onChange={(v) => { if (sel) updScene(sel.id, { ef: v }); }}
                optional
              />
            </div>

            {/* ── 3. Prompt section ── */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  Describe your video <span style={{ color: C.accent }}>*</span>
                </span>
                <span style={{ fontSize: 11, color: (sel?.prompt?.length || 0) > 1800 ? C.red : C.dim }}>
                  {sel?.prompt?.length || 0}/2000
                </span>
              </div>

              <textarea
                ref={promptRef}
                value={sel?.prompt || ''}
                rows={4}
                onChange={(e) => {
                  if (!sel) return;
                  updScene(sel.id, { prompt: e.target.value, status: sel.status === 'empty' ? 'editing' : sel.status });
                  autoResize(e.target);
                  useEditorStore.getState().pushHistoryDebounced();
                }}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="Describe your video, like 'A woman walking through a neon-lit city'. Add elements using @"
                maxLength={2000}
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

            {/* ── 4. "Need an idea?" button + idea chips ── */}
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
                    onClick={() => {
                      if (sel) updScene(sel.id, { prompt: idea, status: 'editing' });
                      setAiIdeas([]);
                    }}
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

            {/* Divider */}
            <div style={{ height: 1, background: C.border }} />

            {/* ── 5. Settings ── */}

            {/* Duration slider */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Duration
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                  {durationValue}s
                </span>
              </div>
              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={durationValue}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setDurationValue(v);
                  if (sel) updScene(sel.id, { duration: v });
                }}
                style={{
                  width: '100%', height: 6,
                  appearance: 'none', WebkitAppearance: 'none',
                  borderRadius: 3, background: C.border,
                  outline: 'none', cursor: 'pointer',
                  accentColor: ACCENT_LIME,
                }}
              />
            </div>

            {/* Model dropdown */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                Model
              </span>
              <div style={{ position: 'relative' }} ref={leftModDropRef}>
                <button
                  onClick={() => setLeftModelsOpen(!leftModelsOpen)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 10,
                    border: `1px solid ${leftModelsOpen ? C.borderActive : C.border}`,
                    background: C.surface, color: C.text,
                    fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'inherit', textAlign: 'left',
                    boxSizing: 'border-box', transition: 'border-color .15s', height: 40,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{selMod.icon}</span>
                  <span style={{ flex: 1 }}>{selMod.name}</span>
                  <span style={{ fontSize: 8, color: C.dim, transform: leftModelsOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}>&#9660;</span>
                </button>
                {leftModelsOpen && (
                  <div
                    role="listbox"
                    style={{
                      position: 'absolute', top: '100%', left: 0, right: 0,
                      marginTop: 4, background: C.card, border: `1px solid ${C.border}`,
                      borderRadius: 12, padding: 4, zIndex: 60,
                      boxShadow: '0 4px 20px rgba(0,0,0,.4)',
                    }}
                  >
                    {MODELS.map((m) => (
                      <div
                        key={m.id}
                        role="option"
                        tabIndex={0}
                        aria-selected={m.id === sel?.model}
                        onClick={() => { if (sel) updScene(sel.id, { model: m.id }); setLeftModelsOpen(false); }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (sel) updScene(sel.id, { model: m.id }); setLeftModelsOpen(false); }
                        }}
                        style={{
                          padding: '8px 10px', borderRadius: 6, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: m.id === sel?.model ? ACCENT_LIME + '10' : 'transparent',
                          transition: 'background .1s',
                        }}
                        onMouseEnter={(e) => { if (m.id !== sel?.model) (e.currentTarget as HTMLElement).style.background = C.cardHover; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = m.id === sel?.model ? ACCENT_LIME + '10' : 'transparent'; }}
                      >
                        <span style={{ fontSize: 14 }}>{m.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: m.id === sel?.model ? ACCENT_LIME : C.text }}>{m.name}</div>
                          <div style={{ fontSize: 9, color: C.sub }}>{m.desc} · {m.speed}</div>
                        </div>
                        {m.id === sel?.model && (
                          <span style={{ fontSize: 10, color: ACCENT_LIME, fontWeight: 700 }}>&#10003;</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Aspect Ratio pills */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                Aspect Ratio
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['16:9', '9:16', '1:1'].map((ar) => (
                  <button
                    key={ar}
                    onClick={() => setAspectRatio(ar)}
                    style={{
                      flex: 1, padding: '7px 14px', borderRadius: 8,
                      border: `1px solid ${aspectRatio === ar ? C.accent : C.border}`,
                      background: aspectRatio === ar ? C.accentDim : 'transparent',
                      color: aspectRatio === ar ? C.accent : C.sub,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none',
                    }}
                  >
                    {ar}
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution pills */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
                Resolution
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {['720p', '1080p', '4K'].map((res) => (
                  <button
                    key={res}
                    onClick={() => setResolution(res)}
                    style={{
                      position: 'relative', flex: 1, padding: '7px 14px', borderRadius: 8,
                      border: `1px solid ${resolution === res ? C.accent : C.border}`,
                      background: resolution === res ? C.accentDim : 'transparent',
                      color: resolution === res ? C.accent : C.sub,
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none',
                    }}
                  >
                    {res}
                    {res === '4K' && plan === 'FREE' && (
                      <span style={{ fontSize: 8, fontWeight: 800, color: C.accent, background: C.accentDim, padding: '1px 5px', borderRadius: 4, letterSpacing: 0.5, lineHeight: 1, position: 'absolute', top: -6, right: -6 }}>
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Credit cost */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: C.accentDim }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>
                1 credit
              </span>
            </div>

            {/* Spacer */}
            <div style={{ flex: 1 }} />

            {/* ── 6. Generate CTA — same as AiThumbnails ── */}
            <button
              className="ed-gen-btn"
              onClick={handleGenerate}
              disabled={disabled}
              aria-busy={isGenerating || undefined}
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
              {isGenerating ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="9" cy="9" r="7" stroke="rgba(255,255,255,.2)" strokeWidth="2" fill="none" />
                    <path d="M9 2a7 7 0 015.2 2.33" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                  {t('editor.generating')}
                </>
              ) : (
                <>{'Generate \u26A1 1'}</>
              )}
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
                Upgrade for more credits
              </a>
            )}
          </div>

          {/* RIGHT PANEL (flex) — same structure as AiThumbnails */}
          <div
            style={{
              flex: 1, minWidth: 0,
              display: 'flex', flexDirection: 'column',
              overflowY: 'auto', overflowX: 'hidden', padding: 20,
            }}
          >
            {/* ── Header: Tab switcher / Preview pill + actions ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexShrink: 0 }}>
              {isGenerating || (sel?.videoUrl && showResult) ? (
                <>
                  {sel?.videoUrl && showResult && !isGenerating && (
                    <button
                      onClick={() => setShowResult(false)}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.borderActive; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '5px 12px', borderRadius: 8,
                        border: `1px solid ${C.border}`, background: 'transparent',
                        color: C.sub, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                        outline: 'none',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                      Back
                    </button>
                  )}
                  <span
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 14px', borderRadius: 20,
                      background: C.accentDim, border: `1px solid ${C.accent}1a`,
                      fontSize: 11, fontWeight: 700, color: C.accent,
                      textTransform: 'uppercase', letterSpacing: 1,
                    }}
                  >
                    PREVIEW {aspectRatio}
                  </span>
                  <div style={{ flex: 1 }} />
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {([
                      { id: 'howto' as const, label: 'How it works', icon: '\uD83C\uDFAC' },
                      { id: 'history' as const, label: `History${scenes.length > 0 ? ` (${scenes.length})` : ''}`, icon: '\uD83D\uDCC1' },
                    ] as const).map((t2) => (
                      <button
                        key={t2.id}
                        onClick={() => setRightPanelTab(t2.id)}
                        onMouseEnter={(e) => { if (rightPanelTab !== t2.id) e.currentTarget.style.borderColor = C.borderActive; }}
                        onMouseLeave={(e) => { if (rightPanelTab !== t2.id) e.currentTarget.style.borderColor = C.border; }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 8,
                          border: `1px solid ${rightPanelTab === t2.id ? C.accent : C.border}`,
                          background: rightPanelTab === t2.id ? C.accentDim : 'transparent',
                          color: rightPanelTab === t2.id ? C.accent : C.sub,
                          fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                          outline: 'none',
                        }}
                      >
                        <span style={{ fontSize: 14, lineHeight: 1 }}>{t2.icon}</span>
                        {t2.label}
                      </button>
                    ))}
                    {rightPanelTab === 'styles' && (
                      <button
                        onClick={() => setRightPanelTab('howto')}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '6px 14px', borderRadius: 8,
                          border: `1px solid ${C.accent}`,
                          background: C.accentDim,
                          color: C.accent,
                          fontSize: 12, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                          outline: 'none',
                        }}
                      >
                        <span style={{ fontSize: 14, lineHeight: 1 }}>{'\uD83C\uDFA8'}</span>
                        Styles
                      </button>
                    )}
                  </div>
                  <div style={{ flex: 1 }} />
                </>
              )}
            </div>

            {/* ── Preview / Content area ────────────────────── */}
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
                    Generating... {Math.round(progress || 0)}%
                  </div>

                  <div style={{ width: 240, height: 6, borderRadius: 3, background: C.border, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 3,
                      width: `${Math.round(progress || 0)}%`,
                      background: `linear-gradient(90deg, ${C.accent}, ${C.accent}cc)`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>

                  <div style={{ fontSize: 13, color: C.dim, maxWidth: 300, textAlign: 'center', lineHeight: 1.5 }}>
                    {(progress || 0) < 30 ? 'AI is composing the perfect shot...'
                      : (progress || 0) < 60 ? 'Generating frames and adding motion...'
                      : (progress || 0) < 90 ? 'Encoding video and optimizing quality...'
                      : 'Almost there, finalizing details...'}
                  </div>
                </div>
              ) : sel?.videoUrl && showResult ? (
                /* ── Generated result with blur reveal ──── */
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: 16, flex: 1 }}>
                    <div style={{
                      width: '100%',
                      aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '9:16' ? '9/16' : '1/1',
                      maxHeight: '60vh',
                      position: 'relative', overflow: 'hidden', borderRadius: 12,
                      background: C.bg,
                      boxShadow: `0 0 20px ${C.accent}15, 0 4px 16px rgba(0,0,0,0.3)`,
                      margin: '0 auto',
                    }}>
                      <video
                        src={sel.videoUrl}
                        controls
                        autoPlay
                        loop
                        style={{
                          width: '100%', height: '100%', objectFit: 'contain', display: 'block',
                          filter: videoRevealed ? 'blur(0px)' : 'blur(20px)',
                          transform: videoRevealed ? 'scale(1)' : 'scale(1.05)',
                          transition: 'filter 0.8s ease-out, transform 0.8s ease-out',
                        }}
                        onCanPlay={() => setVideoRevealed(true)}
                      />
                    </div>
                  </div>
                </div>
              ) : rightPanelTab === 'howto' ? (
                /* ── How it works tab ────────────────────────── */
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  <h2 style={{ fontSize: 24, fontWeight: 800, color: C.text, margin: '0 0 6px' }}>
                    MAKE VIDEOS IN ONE CLICK
                  </h2>
                  <p style={{ fontSize: 14, color: C.sub, marginBottom: 24, maxWidth: 520 }}>
                    250+ presets for camera control, framing, and high-quality VFX
                  </p>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 16,
                  }}>
                    {/* Step 1 — Add Image */}
                    <div
                      style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 14, overflow: 'hidden',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{
                        aspectRatio: '16/10', background: C.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <div style={{ padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: 'uppercase', marginBottom: 4 }}>
                          Add Image
                        </div>
                        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.4 }}>
                          Upload or generate an image to start your animation
                        </div>
                      </div>
                    </div>

                    {/* Step 2 — Choose Preset */}
                    <div
                      style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 14, overflow: 'hidden',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{
                        aspectRatio: '16/10', background: C.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
                        </svg>
                      </div>
                      <div style={{ padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: 'uppercase', marginBottom: 4 }}>
                          Choose Preset
                        </div>
                        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.4 }}>
                          Pick from 250+ animation presets for camera, framing, and VFX
                        </div>
                      </div>
                    </div>

                    {/* Step 3 — Get Video */}
                    <div
                      style={{
                        background: C.surface, border: `1px solid ${C.border}`,
                        borderRadius: 14, overflow: 'hidden',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <div style={{
                        aspectRatio: '16/10', background: C.bg,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                      </div>
                      <div style={{ padding: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, textTransform: 'uppercase', marginBottom: 4 }}>
                          Get Video
                        </div>
                        <div style={{ fontSize: 12, color: C.sub, lineHeight: 1.4 }}>
                          Click generate and download your high-quality video
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              ) : rightPanelTab === 'history' ? (
                /* ── History tab ─────────────────────────────── */
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  {scenes.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 40, minHeight: 300 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: 0 }}>
                        No generations yet
                      </h3>
                      <p style={{ fontSize: 13, color: C.sub, maxWidth: 300, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                        Generate your first video and it will appear here
                      </p>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                        Generated scenes ({scenes.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {scenes.map((sc) => (
                          <div
                            key={sc.id}
                            onClick={() => setSelId(sc.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10,
                              padding: '8px 10px', borderRadius: 8,
                              background: sc.id === selId ? C.accentDim : 'transparent',
                              border: `1px solid ${sc.id === selId ? C.accent + '30' : 'transparent'}`,
                              cursor: 'pointer', transition: 'all .15s',
                            }}
                            onMouseEnter={(e) => { if (sc.id !== selId) (e.currentTarget as HTMLElement).style.background = C.cardHover; }}
                            onMouseLeave={(e) => { if (sc.id !== selId) (e.currentTarget as HTMLElement).style.background = sc.id === selId ? C.accentDim : 'transparent'; }}
                          >
                            <div style={{
                              width: 48, height: 32, borderRadius: 6,
                              background: sc.sf
                                ? `url(${sc.sf}) center/cover`
                                : `linear-gradient(135deg, ${gc(sc.ck)}22, ${gc(sc.ck)}08)`,
                              border: `1px solid ${C.border}`, flexShrink: 0,
                            }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 10, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sc.label}
                              </div>
                              <div style={{ fontSize: 9, color: C.dim }}>
                                {fmtDur(sc.duration)} · {sc.status}
                              </div>
                            </div>
                            <SceneLockIndicator sceneId={sc.id} />
                          </div>
                        ))}
                        <button
                          onClick={() => addScene()}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.accent + '55'; (e.currentTarget as HTMLElement).style.color = C.accent; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = C.border; (e.currentTarget as HTMLElement).style.color = C.dim; }}
                          style={{
                            width: '100%', padding: '6px 0', borderRadius: 6,
                            border: `1px dashed ${C.border}`, background: 'transparent',
                            color: C.dim, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all .15s',
                          }}
                        >
                          + {t('editor.addScene')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : rightPanelTab === 'styles' ? (
                /* ── Styles gallery ── */
                <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
                  {/* Filter tags */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 12, flexWrap: 'wrap',
                  }}>
                    {STYLE_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className="ed-filter-pill"
                        style={{
                          padding: '6px 14px', borderRadius: 8,
                          fontSize: 11, fontWeight: 600,
                          background: activeCategory === cat.id ? C.accentDim : 'transparent',
                          color: activeCategory === cat.id ? C.accent : C.sub,
                          border: `1px solid ${activeCategory === cat.id ? C.accent : C.border}`,
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                          outline: 'none',
                        }}
                      >
                        {cat.label}
                      </button>
                    ))}

                    {/* Search */}
                    <div style={{ marginLeft: 'auto', position: 'relative' }}>
                      <input
                        value={styleSearch}
                        onChange={(e) => setStyleSearch(e.target.value)}
                        placeholder="Search styles..."
                        style={{
                          padding: '6px 12px 6px 28px', borderRadius: 8,
                          border: `1px solid ${C.border}`, background: C.surface,
                          color: C.text, fontSize: 11, fontFamily: 'inherit',
                          outline: 'none', width: 160, boxSizing: 'border-box',
                          transition: 'border-color .2s',
                        }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = C.borderActive; }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                      />
                      <svg
                        width="12" height="12" viewBox="0 0 24 24" fill="none"
                        stroke={C.dim} strokeWidth="2" strokeLinecap="round"
                        style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
                      >
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>
                  </div>

                  {/* Style grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 10,
                  }}>
                    {filteredStyles.map((s) => (
                      <StyleCard
                        key={s.id}
                        style={s}
                        isSelected={s.id === selectedStyleId}
                        C={C}
                        onSelect={handleStyleSelect}
                      />
                    ))}
                  </div>

                  {filteredStyles.length === 0 && (
                    <div style={{ textAlign: 'center', padding: 40, color: C.dim }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No styles found</div>
                      <div style={{ fontSize: 12 }}>Try a different filter or search term</div>
                    </div>
                  )}
                </div>
              ) : null}
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
                    Want 4K, longer videos, and unlimited presets?
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
      </div>

      {/* ═══ Z1: Script Generator Modal ═══ */}
      {showScriptModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('editor.toolbar.generateScript')}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowScriptModal(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(12px)',
          }}
          onClick={() => setShowScriptModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '32px 28px', width: 420, maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 8px 40px rgba(0,0,0,.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {t('editor.script.generateTitle')}
              </h3>
              <button
                onClick={() => setShowScriptModal(false)}
                aria-label={t('common.close')}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}
              >
                &#10005;
              </button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6, display: 'block' }}>{t('editor.script.videoTopic')}</label>
              <input
                value={scriptTopic}
                onChange={(e) => setScriptTopic(e.target.value)}
                placeholder={t('editor.script.topicPlaceholder')}
                maxLength={500}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color .15s',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = C.purple + '55'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6, display: 'block' }}>{t('editor.script.tone')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {([
                    { value: 'professional' as const, label: t('editor.script.toneProfessional') },
                    { value: 'casual' as const, label: t('editor.script.toneCasual') },
                    { value: 'fun' as const, label: t('editor.script.toneFun') },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setScriptTone(opt.value)}
                      style={{
                        padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: `1px solid ${scriptTone === opt.value ? C.purple + '55' : C.border}`,
                        background: scriptTone === opt.value ? C.purple + '10' : 'transparent',
                        color: scriptTone === opt.value ? C.purple : C.text,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        transition: 'all .15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, marginBottom: 6, display: 'block' }}>{t('editor.script.durationLabel')}</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {([
                    { value: '30s' as const, label: t('editor.script.duration30s') },
                    { value: '1min' as const, label: t('editor.script.duration1min') },
                    { value: '3min' as const, label: t('editor.script.duration3min') },
                  ]).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setScriptDuration(opt.value)}
                      style={{
                        padding: '7px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                        border: `1px solid ${scriptDuration === opt.value ? C.purple + '55' : C.border}`,
                        background: scriptDuration === opt.value ? C.purple + '10' : 'transparent',
                        color: scriptDuration === opt.value ? C.purple : C.text,
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        transition: 'all .15s',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11, color: C.dim, marginBottom: 16 }}>
              {t('editor.script.costNote')}
            </div>

            <button
              onClick={() => {
                if (!scriptTopic.trim()) { toast.error(t('editor.script.topicRequired')); return; }
                generateScript.mutate({ topic: scriptTopic, tone: scriptTone, duration: scriptDuration });
              }}
              disabled={generateScript.isPending || !scriptTopic.trim()}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                background: (!scriptTopic.trim() || generateScript.isPending) ? C.dim : C.purple,
                color: C.text, fontSize: 14, fontWeight: 600, cursor: (!scriptTopic.trim() || generateScript.isPending) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', transition: 'all .2s ease',
                opacity: (!scriptTopic.trim() || generateScript.isPending) ? 0.4 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: (!scriptTopic.trim() || generateScript.isPending) ? 'none' : `0 2px 12px ${C.purple}30`,
              }}
            >
              {generateScript.isPending ? (
                <>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${C.dim}`, borderTopColor: '#fff', animation: 'spin .8s linear infinite', flexShrink: 0 }} />
                  {t('editor.script.generating')}
                </>
              ) : t('editor.script.generateScenario')}
            </button>
          </div>
        </div>
      )}

      {/* ═══ Z2: Captions Modal ═══ */}
      {showCaptionsModal && captionsSrt && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(12px)',
          }}
          onClick={() => setShowCaptionsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '32px 28px', width: 500, maxWidth: 'calc(100vw - 32px)',
              maxHeight: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column',
              boxShadow: '0 8px 40px rgba(0,0,0,.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, margin: 0 }}>{t('editor.captions.title')}</h3>
              <button
                onClick={() => setShowCaptionsModal(false)}
                style={{ width: 28, height: 28, borderRadius: 8, border: 'none', background: 'transparent', color: C.sub, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}
              >
                &#10005;
              </button>
            </div>

            <pre style={{
              flex: 1, minHeight: 0, overflow: 'auto', padding: 16, borderRadius: 10,
              background: C.surface, border: `1px solid ${C.border}`, color: C.text,
              fontSize: 12, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.6,
              whiteSpace: 'pre-wrap', margin: '0 0 16px 0',
            }}>
              {captionsSrt}
            </pre>

            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              <button
                onClick={() => {
                  const blob = new Blob([captionsSrt], { type: 'text/plain;charset=utf-8' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${sync.project?.title || 'video'}-subtitles.srt`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  toast.success(t('editor.captions.downloaded'));
                }}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10, border: 'none',
                  background: C.green, color: C.text, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('editor.captions.downloadSrt')}
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(captionsSrt).then(() => toast.success(t('editor.captions.copied')));
                }}
                style={{
                  flex: 1, padding: '11px 0', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.text, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('editor.captions.copy')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Z5: Create Shorts Modal ═══ */}
      {showShortsModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('editor.toolbar.createShorts')}
          onKeyDown={(e) => { if (e.key === 'Escape') setShowShortsModal(false); }}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, backdropFilter: 'blur(12px)',
          }}
          onClick={() => setShowShortsModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
              padding: '36px 32px', width: 400, maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 8px 40px rgba(0,0,0,.4)', textAlign: 'center',
            }}
          >
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
              background: C.cyan + '12', border: `2px solid ${C.cyan}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={C.cyan} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="2" width="10" height="20" rx="2"/>
                <line x1="12" y1="18" x2="12" y2="18"/>
              </svg>
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 700, color: C.text, margin: '0 0 8px' }}>
              {t('editor.shorts.title')}
            </h3>
            <p style={{ fontSize: 13, color: C.sub, margin: '0 0 20px', lineHeight: 1.6 }}>
              {t('editor.shorts.description')}
            </p>

            <div style={{
              background: C.surface, borderRadius: 10, padding: 16,
              border: `1px solid ${C.border}`, marginBottom: 20, textAlign: 'left',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>{t('editor.shorts.whatWillBeDone')}</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: C.sub, fontSize: 12, lineHeight: 1.8 }}>
                <li>{t('editor.shorts.analyzeHighlights')}</li>
                <li>{t('editor.shorts.autoCrop')}</li>
                <li>{t('editor.shorts.verticalFormat')}</li>
                <li>{t('editor.shorts.optimizeAlgorithms')}</li>
              </ul>
            </div>

            <button
              onClick={() => {
                setShowShortsModal(false);
                toast.info(t('editor.shorts.comingSoon'));
              }}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 12, border: 'none',
                background: C.blue,
                color: C.text, fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s ease',
                boxShadow: `0 2px 12px ${C.blue}30`,
              }}
            >
              {t('editor.shorts.generate')}
            </button>
            <button
              onClick={() => setShowShortsModal(false)}
              style={{
                width: '100%', padding: '11px 0', marginTop: 8, borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.sub, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all .2s ease',
              }}
            >
              {t('editor.shorts.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Delete confirmation overlay */}
      {confirmDel && (
        <div
          style={{
            position: 'fixed', inset: 0, background: C.overlay,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div style={{
            background: C.card, border: `1px solid ${C.border}`, borderRadius: 16,
            padding: '20px 24px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 10, boxShadow: '0 4px 24px rgba(0,0,0,.4)',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{t('editor.deleteSceneConfirm')}</span>
            <span style={{ fontSize: 10, color: C.sub }}>{t('editor.deleteIrreversible')}</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              <button
                onClick={() => { delScene(confirmDel); setConfirmDel(null); }}
                style={{ padding: '7px 22px', borderRadius: 10, border: 'none', background: C.red, color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('editor.delete')}
              </button>
              <button
                onClick={() => setConfirmDel(null)}
                style={{ padding: '7px 22px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.surface, color: C.text, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {t('editor.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

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
        .style-card { transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease !important; }
        .style-card:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(0,0,0,.3); }
        .ed-gen-btn { transition: all .2s ease-out !important; }
        .ed-gen-btn:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(1.08); box-shadow: 0 6px 24px ${C.accent}55 !important; }
        .ed-filter-pill:hover { border-color: ${C.accent}44 !important; color: ${C.accent} !important; }
        input[type="range"]::-webkit-slider-thumb {
          appearance: none; -webkit-appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: ${ACCENT_LIME}; border: 2px solid #fff;
          cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.3);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: ${ACCENT_LIME}; border: 2px solid #fff;
          cursor: pointer; box-shadow: 0 1px 4px rgba(0,0,0,.3);
        }
        * { scrollbar-width: thin; scrollbar-color: ${C.border} transparent; }
      `}</style>
    </div>
  );
}
