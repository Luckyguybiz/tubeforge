'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { fmtTime, fmtDur, pluralRu } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { useRouter } from 'next/navigation';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';

type PrivacyStatus = 'public' | 'unlisted' | 'private';
type PublishState = 'idle' | 'publishing' | 'published' | 'error';

/* ── Platform presets for multi-platform export ─────── */
interface PlatformPreset {
  id: string;
  label: string;
  aspect: string;
  maxDuration: number | null; // seconds, null = unlimited
  format: string;
}

const PLATFORM_PRESETS: PlatformPreset[] = [
  { id: 'youtube',         label: 'YouTube',          aspect: '16:9', maxDuration: null,  format: 'MP4' },
  { id: 'youtube-shorts',  label: 'YouTube Shorts',   aspect: '9:16', maxDuration: 60,    format: 'MP4' },
  { id: 'instagram-reels', label: 'Instagram Reels',  aspect: '9:16', maxDuration: 90,    format: 'MP4' },
  { id: 'tiktok',          label: 'TikTok',           aspect: '9:16', maxDuration: 60,    format: 'MP4' },
  { id: 'instagram-post',  label: 'Instagram Post',   aspect: '1:1',  maxDuration: 60,    format: 'MP4' },
];

/** Save a publish entry to localStorage history */
function savePublishHistory(entry: { platform: string; title: string; url: string; publishedAt: string; scheduled?: boolean }) {
  try {
    const key = 'tf-publish-history';
    const raw = localStorage.getItem(key);
    const list: typeof entry[] = raw ? JSON.parse(raw) : [];
    list.unshift(entry);
    // Keep last 50 entries
    localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
  } catch { /* localStorage unavailable */ }
}

const PRIVACY_OPTIONS: { value: PrivacyStatus; labelKey: string; descKey: string; icon: string }[] = [
  { value: 'public', labelKey: 'preview.privacy.public', descKey: 'preview.privacy.publicDesc', icon: '🌍' },
  { value: 'unlisted', labelKey: 'preview.privacy.unlisted', descKey: 'preview.privacy.unlistedDesc', icon: '🔗' },
  { value: 'private', labelKey: 'preview.privacy.private', descKey: 'preview.privacy.privateDesc', icon: '🔒' },
];

/* ── Skeleton loader ─────────────────────────────────── */
function PreviewSkeleton() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '0 12px', boxSizing: 'border-box' as const }}>
      <Skeleton width={220} height={32} />
      <div style={{ marginTop: 8 }}><Skeleton width={340} height={16} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 768 ? '1fr' : '1fr 380px', gap: 24, marginTop: 28 }}>
        <div>
          <Skeleton width="100%" height={0} style={{ paddingBottom: '56.25%' }} rounded />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, overflowX: 'auto' }}>
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} width={120} height={68} rounded />
            ))}
          </div>
          <div style={{ marginTop: 20 }}><Skeleton width="100%" height={140} rounded /></div>
        </div>
        <div>
          <Skeleton width="100%" height={200} rounded />
          <div style={{ marginTop: 12 }}><Skeleton width="100%" height={280} rounded /></div>
          <div style={{ marginTop: 12 }}><Skeleton width="100%" height={56} rounded /></div>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────── */
export function PreviewSave({ projectId }: { projectId: string | null }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();

  /* ── State ────────────────────────────────────────── */
  const [privacy, setPrivacy] = useState<PrivacyStatus>('private');
  const [publishState, setPublishState] = useState<PublishState>('idle');
  const [publishProgress, setPublishProgress] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string>('youtube');
  const [exportResolution, setExportResolution] = useState<'720p' | '1080p' | '4k'>('720p');
  const [exportAspect, setExportAspect] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const planInfo = usePlanLimits();

  // Z2: SRT captions — state kept for potential future "view in modal" feature
  const [, setSrtContent] = useState<string | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Queries ──────────────────────────────────────── */
  const project = trpc.project.getById.useQuery(
    { id: projectId! },
    { enabled: !!projectId },
  );

  const channels = trpc.youtube.getChannels.useQuery(undefined, {
    enabled: !!projectId,
    retry: false,
  });

  const saveProject = trpc.project.update.useMutation({
    onSuccess: () => {
      toast.success(useLocaleStore.getState().t('preview.projectSaved'));
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadVideo = trpc.youtube.uploadVideo.useMutation({
    onSuccess: (data) => {
      setPublishState('published');
      setPublishProgress(100);
      if (data.uploadUrl) setYoutubeUrl(data.uploadUrl);
      const tFn = useLocaleStore.getState().t;
      toast.success(data.scheduled ? tFn('preview.videoScheduled') : tFn('preview.videoUploaded'));
      if (projectId) saveProject.mutate({ id: projectId, status: 'PUBLISHED' });
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      // Save to publishing history
      savePublishHistory({
        platform: 'YouTube',
        title: p?.title ?? 'Untitled',
        url: data.uploadUrl ?? '',
        publishedAt: new Date().toISOString(),
        scheduled: data.scheduled,
      });
      // First video celebration
      try {
        const celebKey = 'tf-first-video-celebrated';
        if (typeof window !== 'undefined' && !localStorage.getItem(celebKey)) {
          localStorage.setItem(celebKey, '1');
          setShowCelebration(true);
        }
      } catch { /* localStorage unavailable */ }
    },
    onError: (err) => {
      setPublishState('error');
      setPublishProgress(0);
      toast.error(err.message);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    },
  });

  /* Auto-select first channel */
  useEffect(() => {
    if (channels.data?.length && !selectedChannel) {
      setSelectedChannel(channels.data[0]?.id ?? '');
    }
  }, [channels.data, selectedChannel]);

  /* Cleanup progress timer on unmount */
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  // Z2: AI Captions mutation for SRT download
  const generateCaptions = trpc.ai.generateCaptions.useMutation({
    onSuccess: (data) => {
      if (data.srt) {
        setSrtContent(data.srt);
        // Auto-download
        const blob = new Blob([data.srt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${p?.title || 'video'}-subtitles.srt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('SRT файл скачан!');
      } else {
        toast.error('Не удалось сгенерировать субтитры');
      }
    },
    onError: (err: { message: string }) => toast.error(err.message),
  });

  /* ── Derived data (memoized) ─────────────────────── */
  /* All hooks must be called unconditionally (React Rules of Hooks).
     When project data is not yet available we use safe empty defaults. */
  const p = project.data ?? null;
  const scenes = useMemo(() => p?.scenes ?? [], [p?.scenes]);
  const scenesWithVideo = useMemo(() => scenes.filter(s => s.videoUrl), [scenes]);
  const totalDuration = useMemo(() => scenes.reduce((sum, sc) => sum + sc.duration, 0), [scenes]);
  const hasVideo = scenesWithVideo.length > 0;
  const currentVideoUrl = useMemo(() => {
    if (scenesWithVideo.length === 0) return null;
    const sceneAtIdx = scenes[activeSceneIdx];
    const found = scenesWithVideo.find((_s) => sceneAtIdx?.videoUrl && _s.id === sceneAtIdx.id);
    return found?.videoUrl ?? scenesWithVideo[0]?.videoUrl ?? null;
  }, [scenesWithVideo, scenes, activeSceneIdx]);
  const videoUrl = scenesWithVideo[0]?.videoUrl ?? null;
  const tags = useMemo(() => (p?.tags as string[]) ?? [], [p?.tags]);

  /* ── Checklist (memoized) ──────────────────────────── */
  const checklist = useMemo(() => [
    { label: t('preview.checklist.videoReady'), done: scenes.length > 0 && scenes.every(s => s.status === 'READY'), href: `/editor?projectId=${projectId}`, hint: t('preview.checklist.goEditor') },
    { label: t('preview.checklist.metadataFilled'), done: (p?.title?.length ?? 0) > 0 && (p?.description?.length ?? 0) > 0, href: `/metadata?projectId=${projectId}`, hint: t('preview.checklist.goMetadata') },
    { label: t('preview.checklist.thumbnailCreated'), done: !!(p?.thumbnailUrl || p?.thumbnailData), href: `/thumbnails?projectId=${projectId}`, hint: t('preview.checklist.goThumbnails') },
    { label: t('preview.checklist.channelConnected'), done: (channels.data?.length ?? 0) > 0, href: '/dashboard', hint: t('preview.checklist.connectYoutube') },
  ], [scenes, p?.title, p?.description, p?.thumbnailUrl, p?.thumbnailData, projectId, channels.data?.length, t]);
  const checklistDone = useMemo(() => checklist.filter(c => c.done).length, [checklist]);
  const allReady = useMemo(() => checklist.every(c => c.done), [checklist]);

  /* ── Handlers ─────────────────────────────────────── */
  const handleSceneEnded = useCallback(() => {
    // Find the next scene with a video after the current activeSceneIdx
    let nextIdx = -1;
    for (let i = activeSceneIdx + 1; i < scenes.length; i++) {
      if (scenes[i].videoUrl) {
        nextIdx = i;
        break;
      }
    }
    if (nextIdx !== -1) {
      setActiveSceneIdx(nextIdx);
      // Video src will change, auto-play on load
      setTimeout(() => {
        videoRef.current?.play();
      }, 50);
    } else {
      setIsPlaying(false);
      setIsPlayingAll(false);
    }
  }, [activeSceneIdx, scenes]);

  const handlePlayAll = useCallback(() => {
    if (scenesWithVideo.length < 2) return;
    // Find the first scene index that has a video
    const firstIdx = scenes.findIndex(s => s.videoUrl);
    if (firstIdx === -1) return;
    setActiveSceneIdx(firstIdx);
    setIsPlayingAll(true);
    setIsPlaying(true);
    setTimeout(() => {
      videoRef.current?.play();
    }, 50);
  }, [scenes, scenesWithVideo.length]);

  const handlePlayPause = useCallback(() => {
    if (!hasVideo) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [hasVideo, isPlaying]);

  const handlePublish = useCallback(() => {
    if (!p) return;
    if (!allReady) {
      toast.warning(t('preview.checklistWarning'));
      return;
    }
    if (!videoUrl) {
      toast.error(t('preview.noVideoError'));
      return;
    }
    if (!selectedChannel) {
      toast.error(t('preview.noChannelError'));
      return;
    }

    setPublishState('publishing');
    setPublishProgress(0);

    // Simulate progress while uploading
    progressTimerRef.current = setInterval(() => {
      setPublishProgress(prev => {
        if (prev >= 90) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);
          return 90;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 500);

    // Build publishAt ISO string if scheduling is enabled
    let publishAt: string | undefined;
    if (scheduleEnabled && scheduleDate && scheduleTime) {
      publishAt = new Date(`${scheduleDate}T${scheduleTime}:00`).toISOString();
    }

    uploadVideo.mutate({
      title: p.title,
      description: p.description ?? '',
      tags,
      videoUrl,
      thumbnailUrl: p.thumbnailUrl ?? undefined,
      privacyStatus: privacy,
      publishAt,
    });
  }, [p, allReady, videoUrl, selectedChannel, tags, privacy, t, uploadVideo, scheduleEnabled, scheduleDate, scheduleTime]);

  const handleDownload = useCallback(() => {
    if (!videoUrl || !p) {
      toast.error(t('preview.noVideoDownload'));
      return;
    }
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${p.title || 'video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [videoUrl, p, t]);

  /* ── Card style helper ────────────────────────────── */
  const cardStyle = useMemo<React.CSSProperties>(() => ({
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    overflow: 'hidden',
  }), [C.card, C.border]);

  const cardPadded = useMemo<React.CSSProperties>(() => ({
    ...cardStyle,
    padding: 20,
  }), [cardStyle]);

  const sectionTitle = useMemo<React.CSSProperties>(() => ({
    fontSize: 13,
    fontWeight: 700,
    color: C.text,
    letterSpacing: '0.01em',
    textTransform: 'uppercase' as const,
    marginBottom: 14,
  }), [C.text]);

  /* ── Early returns (after all hooks) ─────────────── */
  if (!projectId) {
    return <ProjectPicker target="/preview" title={t('preview.title')} />;
  }

  if (project.isLoading) return <PreviewSkeleton />;

  if (project.isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>!</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 4 }}>{t('preview.loadError')}</div>
        <div style={{ fontSize: 13, color: C.sub, maxWidth: 400, textAlign: 'center' }}>{project.error?.message || t('preview.loadErrorDefault')}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={() => project.refetch()}
            style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
          >
            {t('preview.retry')}
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
          >
            {t('preview.toDashboard')}
          </button>
        </div>
      </div>
    );
  }

  if (!p) return null;

  /* ── RENDER ───────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: isMobile ? '0 12px' : 0, boxSizing: 'border-box' as const }}>

      {/* ── First Video Celebration Overlay ─────────── */}
      {showCelebration && (
        <>
          <style>{`
            @keyframes tf-confetti-fall {
              0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
              100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
            }
            @keyframes tf-celebrate-in {
              0% { transform: translate(-50%, -50%) scale(0.7); opacity: 0; }
              100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
          `}</style>
          <div
            onClick={() => setShowCelebration(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 9998,
              background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)',
            }}
          />
          {/* Confetti particles (CSS only) */}
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{
              position: 'fixed',
              zIndex: 9999,
              top: 0,
              left: `${4 + (i * 4) % 92}%`,
              width: 8 + (i % 3) * 4,
              height: 8 + (i % 3) * 4,
              borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? 2 : 0,
              background: ['#ef4444', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'][i % 6],
              animation: `tf-confetti-fall ${2 + (i % 4) * 0.5}s ease-in ${(i % 8) * 0.15}s forwards`,
              pointerEvents: 'none',
            }} />
          ))}
          {/* Celebration card */}
          <div role="dialog" aria-modal="true" aria-label={t('celebration.title')} style={{
            position: 'fixed', zIndex: 10000,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 20, padding: '36px 28px',
            textAlign: 'center', maxWidth: 380, width: 'calc(100% - 32px)',
            boxShadow: '0 24px 60px rgba(0,0,0,.3)',
            animation: 'tf-celebrate-in .4s cubic-bezier(.4,0,.2,1) forwards',
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>&#127916;</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 8, letterSpacing: '-.02em' }}>
              {t('celebration.title')}
            </h2>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button
                onClick={() => { setShowCelebration(false); handleDownload(); }}
                style={{
                  padding: '11px 24px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.text, fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s',
                }}
              >
                {t('celebration.download')}
              </button>
              <button
                onClick={() => { setShowCelebration(false); router.push('/editor'); }}
                style={{
                  padding: '11px 24px', borderRadius: 10,
                  border: 'none',
                  background: `linear-gradient(135deg, ${C.accent}, ${C.pink})`,
                  color: '#fff', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all .15s',
                  boxShadow: `0 4px 16px ${C.accent}33`,
                }}
              >
                {t('celebration.createMore')}
              </button>
            </div>
            <p style={{ fontSize: 12, color: C.dim, marginTop: 16, lineHeight: 1.5 }}>
              {t('celebration.proNote')}
            </p>
          </div>
        </>
      )}

      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 16 : 24, flexWrap: 'wrap', gap: isMobile ? 10 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard')}
            title={t('preview.backToDashboardTitle')}
            style={{
              width: 44, height: 44, borderRadius: 10, border: `1px solid ${C.border}`,
              background: C.surface, color: C.sub, fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit', transition: 'all .15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
          >
            &#8592;
          </button>
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, margin: 0, color: C.text, letterSpacing: '-0.02em' }}>
              {t('preview.title')}
            </h1>
            <p style={{ fontSize: 13, color: C.sub, margin: '2px 0 0' }}>
              {p.title || t('preview.untitled')} &middot; {pluralRu(scenes.length, t('preview.scene.one'), t('preview.scene.few'), t('preview.scene.many'))} &middot; {fmtTime(totalDuration)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDownload}
            disabled={!hasVideo}
            title={hasVideo ? t('preview.downloadTitle') : t('preview.downloadDisabled')}
            style={{
              padding: '9px 18px', minHeight: 44, borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'transparent', color: hasVideo ? C.text : C.dim,
              fontSize: 13, fontWeight: 600, cursor: hasVideo ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              opacity: hasVideo ? 1 : 0.5, transition: 'all .15s',
            }}
            onMouseEnter={e => { if (hasVideo) e.currentTarget.style.borderColor = C.blue; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
          >
            <span style={{ fontSize: 15 }}>&#8681;</span>
            {t('preview.downloadVideo')}
          </button>
          {/* Z2: Download SRT captions */}
          <button
            onClick={() => {
              const scenesData = scenes.filter((s: { prompt?: string | null; duration: number }) => (s.prompt ?? '').trim()).map((s: { prompt?: string | null; duration: number }) => ({
                text: s.prompt || '',
                duration: s.duration,
              }));
              if (scenesData.length === 0) {
                toast.info('Нет текста сцен для генерации субтитров');
                return;
              }
              generateCaptions.mutate({ scenes: scenesData });
            }}
            disabled={generateCaptions.isPending || scenes.length === 0}
            title="Сгенерировать и скачать субтитры (.SRT)"
            style={{
              padding: '9px 18px', minHeight: 44, borderRadius: 10, border: `1px solid ${C.border}`,
              background: 'transparent', color: scenes.length > 0 && !generateCaptions.isPending ? C.text : C.dim,
              fontSize: 13, fontWeight: 600,
              cursor: scenes.length > 0 && !generateCaptions.isPending ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 6,
              opacity: scenes.length > 0 ? 1 : 0.5, transition: 'all .15s',
            }}
            onMouseEnter={e => { if (scenes.length > 0) e.currentTarget.style.borderColor = C.green; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
          >
            {generateCaptions.isPending ? (
              <>
                <span style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${C.dim}44`, borderTopColor: C.dim, animation: 'spin .8s linear infinite', display: 'inline-block' }} />
                Генерация...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="M7 15h4m-4-3h10"/>
                </svg>
                Скачать .SRT
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Watermark indicator ─────────────────────── */}
      {planInfo.plan === 'FREE' ? (
        <div style={{
          padding: '10px 14px',
          borderRadius: 10,
          background: `${C.orange}08`,
          border: `1px solid ${C.orange}20`,
          fontSize: 12,
          color: C.sub,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 14 }}>&#9888;</span>
          <div>
            <div style={{ fontWeight: 600, color: C.orange, marginBottom: 2 }}>
              {t('preview.watermarkFree')}
            </div>
            <div style={{ fontSize: 11, color: C.dim }}>
              {t('preview.watermarkFreeHint')}
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          padding: '8px 14px',
          borderRadius: 10,
          background: `${C.green}08`,
          border: `1px solid ${C.green}20`,
          fontSize: 12,
          color: C.green,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontWeight: 600,
        }}>
          <span style={{ fontSize: 14 }}>&#10003;</span>
          {t('preview.watermarkNone')}
        </div>
      )}

      {/* ── Export options ───────────────────────────── */}
      <div style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        marginBottom: 16,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
      }}>
        {/* Resolution selector */}
        <div style={{ flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {t('preview.exportResolution')}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { value: '720p' as const, label: '720p', plan: 'FREE' },
              { value: '1080p' as const, label: '1080p', plan: 'PRO' },
              { value: '4k' as const, label: '4K', plan: 'STUDIO' },
            ]).map((opt) => {
              const planOrder = { FREE: 0, PRO: 1, STUDIO: 2 };
              const userPlanLevel = planOrder[planInfo.plan] ?? 0;
              const optPlanLevel = planOrder[opt.plan as keyof typeof planOrder] ?? 0;
              const available = userPlanLevel >= optPlanLevel;
              const isActive = exportResolution === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (available) {
                      setExportResolution(opt.value);
                    } else {
                      toast.warning(t('preview.upgradePlanForResolution'));
                    }
                  }}
                  style={{
                    flex: 1, padding: '6px 4px', borderRadius: 6,
                    border: `1px solid ${isActive ? C.accent : C.border}`,
                    background: isActive ? `${C.accent}12` : 'transparent',
                    color: available ? (isActive ? C.accent : C.sub) : C.dim,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', opacity: available ? 1 : 0.5,
                    transition: 'all .15s', position: 'relative',
                  }}
                >
                  {opt.label}
                  {!available && (
                    <span style={{ display: 'block', fontSize: 8, color: C.orange, marginTop: 1 }}>
                      {opt.plan}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Aspect ratio selector */}
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {t('preview.exportAspect')}
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { value: '16:9' as const, label: '16:9', desc: 'YouTube' },
              { value: '9:16' as const, label: '9:16', desc: 'Shorts' },
              { value: '1:1' as const, label: '1:1', desc: 'Instagram' },
            ]).map((opt) => {
              const isActive = exportAspect === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setExportAspect(opt.value)}
                  style={{
                    flex: 1, padding: '6px 4px', borderRadius: 6,
                    border: `1px solid ${isActive ? C.accent : C.border}`,
                    background: isActive ? `${C.accent}12` : 'transparent',
                    color: isActive ? C.accent : C.sub,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit', transition: 'all .15s',
                  }}
                >
                  {opt.label}
                  <span style={{ display: 'block', fontSize: 8, color: C.dim, marginTop: 1 }}>
                    {opt.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Format indicator */}
        <div style={{ minWidth: 70 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
            {t('preview.exportFormat')}
          </div>
          <div style={{
            padding: '6px 10px', borderRadius: 6,
            border: `1px solid ${C.accent}30`,
            background: `${C.accent}08`,
            color: C.accent, fontSize: 11, fontWeight: 700,
            textAlign: 'center',
          }}>
            MP4
          </div>
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: isMobile ? 16 : 24, alignItems: 'start' }}>
        {/* ── LEFT COLUMN ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Video player ───────────────────────────── */}
          <div style={cardStyle}>
            <div style={{
              position: 'relative', aspectRatio: '16/9', background: '#000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {hasVideo && (scenes[activeSceneIdx]?.videoUrl || currentVideoUrl) ? (
                <>
                  <video
                    ref={videoRef}
                    src={scenes[activeSceneIdx]?.videoUrl || currentVideoUrl || undefined}
                    poster={p.thumbnailUrl ?? undefined}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onEnded={handleSceneEnded}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  {/* Play/Pause overlay */}
                  <button
                    onClick={handlePlayPause}
                    style={{
                      position: 'absolute', inset: 0, background: isPlaying ? 'transparent' : 'rgba(0,0,0,.35)',
                      border: 'none', cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', transition: 'background .2s',
                    }}
                    aria-label={isPlaying ? t('preview.pauseLabel') : t('preview.playLabel')}
                  >
                    {!isPlaying && (
                      <div style={{
                        width: 72, height: 50, borderRadius: 14,
                        background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'transform .15s',
                      }}>
                        <div style={{
                          width: 0, height: 0,
                          borderLeft: '20px solid #fff',
                          borderTop: '12px solid transparent',
                          borderBottom: '12px solid transparent',
                          marginLeft: 4,
                        }} />
                      </div>
                    )}
                  </button>
                </>
              ) : (
                /* No video placeholder */
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', gap: 12, padding: 40,
                }}>
                  {p.thumbnailUrl ? (
                    <Image
                      src={p.thumbnailUrl}
                      alt={t('preview.thumbnailAlt')}
                      fill
                      style={{
                        objectFit: 'cover', opacity: 0.3, filter: 'blur(4px)',
                      }}
                      unoptimized
                    />
                  ) : null}
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%',
                    background: 'rgba(255,255,255,.05)', border: '2px solid rgba(255,255,255,.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, zIndex: 1,
                  }}>
                    &#9654;
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', zIndex: 1, textAlign: 'center' }}>
                    {scenes.length > 0 ? t('preview.noReadyVideos') : t('preview.generateFirst')}
                  </div>
                  <button
                    onClick={() => router.push(`/editor?projectId=${projectId}`)}
                    style={{
                      padding: '10px 24px', borderRadius: 10, border: 'none',
                      background: C.accent, color: '#fff', fontSize: 13,
                      fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      zIndex: 1, transition: 'opacity .15s',
                    }}
                  >
                    {t('preview.openEditor')}
                  </button>
                </div>
              )}

              {/* Scene indicator badge */}
              {scenes.length > 1 && hasVideo && (
                <div style={{
                  position: 'absolute', bottom: 10, left: 10,
                  background: 'rgba(0,0,0,.85)', borderRadius: 6,
                  padding: '3px 8px', fontSize: 12, fontWeight: 700,
                  color: '#fff', zIndex: 3, letterSpacing: '0.03em',
                }}>
                  {t('preview.sceneTitle')} {activeSceneIdx + 1} / {scenes.length}
                </div>
              )}

              {/* Duration badge */}
              {totalDuration > 0 && (
                <div style={{
                  position: 'absolute', bottom: 10, right: 10,
                  background: 'rgba(0,0,0,.85)', borderRadius: 6,
                  padding: '3px 8px', fontSize: 12, fontWeight: 700,
                  color: '#fff', zIndex: 3, letterSpacing: '0.03em',
                }}>
                  {fmtTime(totalDuration)}
                </div>
              )}
            </div>

            {/* ── Scene thumbnails timeline ──────────── */}
            {scenes.length > 0 && (
              <div style={{
                display: 'flex', gap: 6, padding: isMobile ? '10px 10px' : '12px 16px',
                overflowX: 'auto', borderTop: `1px solid ${C.border}`,
                background: C.surface, alignItems: 'center',
                WebkitOverflowScrolling: 'touch' as const,
              }}>
                {/* Play All button — shown when multiple scenes have video */}
                {scenesWithVideo.length > 1 && (
                  <button
                    onClick={isPlayingAll ? () => { videoRef.current?.pause(); setIsPlaying(false); setIsPlayingAll(false); } : handlePlayAll}
                    title={isPlayingAll ? t('preview.stopAllScenes') : t('preview.playAllScenes')}
                    style={{
                      flexShrink: 0, height: 68, padding: '0 14px', borderRadius: 8,
                      border: `2px solid ${isPlayingAll ? C.accent : C.border}`,
                      background: isPlayingAll ? `${C.accent}12` : C.card,
                      cursor: 'pointer', display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 4,
                      fontFamily: 'inherit', transition: 'all .15s',
                    }}
                    onMouseEnter={e => { if (!isPlayingAll) e.currentTarget.style.borderColor = C.accent; }}
                    onMouseLeave={e => { if (!isPlayingAll) e.currentTarget.style.borderColor = C.border; }}
                  >
                    <span style={{ fontSize: 16, color: isPlayingAll ? C.accent : C.sub }}>
                      {isPlayingAll ? '\u23F9' : '\u23EF'}
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isPlayingAll ? C.accent : C.sub, whiteSpace: 'nowrap' }}>
                      {isPlayingAll ? t('preview.stop') : t('preview.allScenes')}
                    </span>
                  </button>
                )}
                {scenes.map((scene, idx) => {
                  const isActive = idx === activeSceneIdx;
                  const isReady = scene.status === 'READY';
                  const isCurrentlyPlaying = isActive && isPlaying;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => {
                        setActiveSceneIdx(idx);
                        setIsPlayingAll(false);
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          // Will auto-update via src change; pause current
                          videoRef.current.pause();
                          setIsPlaying(false);
                        }
                      }}
                      title={`${t('preview.sceneTitle')} ${idx + 1}: ${scene.label || t('preview.untitled')} (${fmtDur(scene.duration)})${isCurrentlyPlaying ? ` — ${t('preview.nowPlaying')}` : ''}`}
                      style={{
                        flexShrink: 0, width: 120, height: 68, borderRadius: 8,
                        border: `2px solid ${isActive ? C.accent : 'transparent'}`,
                        background: isReady ? '#1a1a2e' : C.card,
                        cursor: 'pointer', position: 'relative', overflow: 'hidden',
                        outline: 'none', padding: 0, transition: 'border-color .15s',
                      }}
                    >
                      {scene.videoUrl ? (
                        <div style={{
                          width: '100%', height: '100%',
                          background: `linear-gradient(135deg, ${C.purple}30, ${C.blue}20)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 18, opacity: 0.5 }}>&#9654;</span>
                        </div>
                      ) : (
                        <div style={{
                          width: '100%', height: '100%',
                          background: C.surface,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <span style={{ fontSize: 10, color: C.dim }}>
                            {scene.status === 'GENERATING' ? '...' : scene.status === 'ERROR' ? '!' : ''}
                          </span>
                        </div>
                      )}
                      {/* Scene number badge */}
                      <div style={{
                        position: 'absolute', top: 4, left: 4,
                        background: 'rgba(0,0,0,.7)', borderRadius: 4,
                        padding: '1px 5px', fontSize: 9, fontWeight: 700, color: '#fff',
                      }}>
                        {idx + 1}
                      </div>
                      {/* Duration badge */}
                      <div style={{
                        position: 'absolute', bottom: 4, right: 4,
                        background: 'rgba(0,0,0,.7)', borderRadius: 4,
                        padding: '1px 5px', fontSize: 9, fontWeight: 600, color: '#fff',
                      }}>
                        {fmtDur(scene.duration)}
                      </div>
                      {/* Status indicator */}
                      <div style={{
                        position: 'absolute', top: 4, right: 4,
                        width: 8, height: 8, borderRadius: '50%',
                        background: isCurrentlyPlaying ? C.accent
                          : scene.status === 'READY' ? C.green
                          : scene.status === 'GENERATING' ? C.orange
                          : scene.status === 'ERROR' ? C.accent
                          : C.dim,
                        animation: isCurrentlyPlaying ? 'pulse 1.2s ease infinite' : undefined,
                      }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Metadata summary ────────────────────── */}
          <div style={cardPadded}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={sectionTitle}>{t('preview.metadata')}</div>
              <button
                onClick={() => router.push(`/metadata?projectId=${projectId}`)}
                style={{
                  padding: '5px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                  background: 'transparent', color: C.sub, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.sub; e.currentTarget.style.borderColor = C.border; }}
              >
                {t('preview.edit')}
              </button>
            </div>

            {/* Title card */}
            <div style={{
              background: C.surface, borderRadius: 10, padding: '12px 16px', marginBottom: 10,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {t('preview.metaTitle')}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: p.title ? C.text : C.dim }}>
                {p.title || t('preview.notSpecified')}
              </div>
            </div>

            {/* Description card */}
            <div style={{
              background: C.surface, borderRadius: 10, padding: '12px 16px', marginBottom: 10,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                {t('preview.metaDescription')}
              </div>
              <div style={{
                fontSize: 13, color: p.description ? C.sub : C.dim, lineHeight: 1.6,
                maxHeight: 80, overflow: 'hidden',
                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', display: '-webkit-box',
              }}>
                {p.description || t('preview.notSpecified')}
              </div>
            </div>

            {/* Tags card */}
            <div style={{
              background: C.surface, borderRadius: 10, padding: '12px 16px',
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                {t('preview.metaTags')}
              </div>
              {tags.length > 0 ? (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {tags.map((tag, i) => (
                    <span key={i} style={{
                      padding: '3px 10px', borderRadius: 6,
                      background: `${C.blue}15`, color: C.blue,
                      fontSize: 12, fontWeight: 500,
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 13, color: C.dim }}>{t('preview.tagsNotSpecified')}</div>
              )}
            </div>
          </div>

          {/* ── Thumbnail preview ──────────────────── */}
          <div style={cardPadded}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={sectionTitle}>{t('preview.thumbnail')}</div>
              <button
                onClick={() => router.push(`/thumbnails?projectId=${projectId}`)}
                style={{
                  padding: '5px 14px', borderRadius: 8, border: `1px solid ${C.border}`,
                  background: 'transparent', color: C.sub, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.color = C.sub; e.currentTarget.style.borderColor = C.border; }}
              >
                {t('preview.edit')}
              </button>
            </div>
            {p.thumbnailUrl ? (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <Image
                  src={p.thumbnailUrl}
                  alt={t('preview.thumbnailAltFull')}
                  width={640}
                  height={360}
                  loading="lazy"
                  style={{ width: '100%', height: 'auto', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
                  unoptimized
                />
              </div>
            ) : (
              <div style={{
                aspectRatio: '16/9', borderRadius: 10, border: `2px dashed ${C.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8, background: C.surface,
              }}>
                <div style={{ fontSize: 28, opacity: 0.2 }}>&#128444;</div>
                <div style={{ fontSize: 12, color: C.dim }}>{t('preview.thumbnailNotCreated')}</div>
                <button
                  onClick={() => router.push(`/thumbnails?projectId=${projectId}`)}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.sub, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {t('preview.createThumbnail')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: isMobile ? 'static' : 'sticky', top: 20 }}>

          {/* ── Pre-publish checklist ──────────────── */}
          <div style={cardPadded}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={sectionTitle}>{t('preview.checklist')}</div>
              <div style={{
                padding: '3px 10px', borderRadius: 20,
                background: allReady ? `${C.green}15` : `${C.orange}15`,
                color: allReady ? C.green : C.orange,
                fontSize: 12, fontWeight: 700,
              }}>
                {checklistDone}/{checklist.length}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 4, borderRadius: 2, background: C.surface, marginBottom: 14, overflow: 'hidden',
            }}>
              <div style={{
                width: `${(checklistDone / checklist.length) * 100}%`,
                height: '100%', borderRadius: 2,
                background: allReady
                  ? C.green
                  : `linear-gradient(90deg, ${C.orange}, ${C.accent})`,
                transition: 'width .4s ease',
              }} />
            </div>

            {checklist.map((item, i) => (
              <div
                key={i}
                role={item.done ? undefined : 'link'}
                tabIndex={item.done ? undefined : 0}
                onClick={() => !item.done && router.push(item.href)}
                onKeyDown={(e) => { if (!item.done && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); router.push(item.href); } }}
                title={item.done ? undefined : item.hint}
                aria-label={item.done ? `${item.label} -- ${t('preview.checklistDone')}` : `${item.label} -- ${item.hint}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 10px', marginLeft: -10, marginRight: -10,
                  borderRadius: 8,
                  borderTop: i ? `1px solid ${C.border}` : 'none',
                  cursor: item.done ? 'default' : 'pointer',
                  transition: 'background .12s',
                }}
                onMouseEnter={(e) => { if (!item.done) e.currentTarget.style.background = C.surface; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{
                  width: 24, height: 24, borderRadius: 8, flexShrink: 0,
                  border: `2px solid ${item.done ? C.green : C.border}`,
                  background: item.done ? `${C.green}15` : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700, color: C.green,
                  transition: 'all .2s',
                }}>
                  {item.done ? '\u2713' : ''}
                </div>
                <span style={{
                  flex: 1, fontSize: 13,
                  color: item.done ? C.text : C.sub,
                  fontWeight: item.done ? 500 : 400,
                  textDecoration: item.done ? 'none' : 'none',
                }}>
                  {item.label}
                </span>
                {!item.done && (
                  <span style={{ fontSize: 11, color: C.dim, fontWeight: 500 }}>&#8594;</span>
                )}
              </div>
            ))}
          </div>

          {/* ── Platform Presets ────────────────────── */}
          <div style={cardPadded}>
            <div style={sectionTitle}>{t('preview.platformPresets')}</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {PLATFORM_PRESETS.map((preset) => {
                const isActive = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    style={{
                      padding: '8px 14px', borderRadius: 10,
                      border: `2px solid ${isActive ? C.accent : C.border}`,
                      background: isActive ? `${C.accent}08` : C.surface,
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                      transition: 'all .15s', minWidth: 0,
                    }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? C.accent : C.text, whiteSpace: 'nowrap' }}>
                      {preset.label}
                    </span>
                    <span style={{ fontSize: 10, color: C.dim }}>
                      {preset.aspect} {preset.format}
                    </span>
                  </button>
                );
              })}
            </div>
            {(() => {
              const active = PLATFORM_PRESETS.find((p) => p.id === selectedPreset);
              if (!active) return null;
              return (
                <div style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 8,
                  background: C.surface, border: `1px solid ${C.border}`,
                  fontSize: 11, color: C.sub, lineHeight: 1.6,
                }}>
                  <span style={{ fontWeight: 600, color: C.text }}>{active.label}:</span>{' '}
                  {t('preview.presetAspect')} {active.aspect}, {active.format}
                  {active.maxDuration
                    ? ` — ${t('preview.presetMaxDuration')} ${active.maxDuration}${t('preview.presetSeconds')}`
                    : ` — ${t('preview.presetNoDurationLimit')}`}
                </div>
              );
            })()}
          </div>

          {/* ── Publish to YouTube ─────────────────── */}
          {publishState === 'published' ? (
            /* ── Published success state ────────────── */
            <div style={{
              ...cardPadded,
              background: `linear-gradient(135deg, ${C.card}, ${C.green}08)`,
              border: `1px solid ${C.green}30`,
            }}>
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%', margin: '0 auto 14px',
                  background: `${C.green}15`, border: `2px solid ${C.green}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, color: C.green,
                }}>
                  &#10003;
                </div>
                <div style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 4 }}>
                  {scheduleEnabled ? t('preview.scheduledSuccess') : t('preview.published')}
                </div>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>
                  {scheduleEnabled && scheduleDate
                    ? `${t('preview.scheduledFor')} ${scheduleDate} ${scheduleTime}`
                    : t('preview.videoSentToYoutube')}
                </div>
                {youtubeUrl && (
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '10px 24px', borderRadius: 10,
                        background: '#ff0000', color: '#fff',
                        fontSize: 13, fontWeight: 600, textDecoration: 'none',
                        transition: 'opacity .15s',
                      }}
                    >
                      <span style={{ fontSize: 16 }}>&#9654;</span>
                      {t('preview.openOnYoutube')}
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(youtubeUrl);
                        toast.success(t('preview.linkCopied'));
                      }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '10px 20px', borderRadius: 10,
                        border: `1px solid ${C.border}`, background: 'transparent',
                        color: C.text, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all .15s',
                      }}
                    >
                      <span style={{ fontSize: 14 }}>&#128203;</span>
                      {t('preview.copyLink')}
                    </button>
                  </div>
                )}
                <button
                  onClick={() => router.push('/dashboard')}
                  style={{
                    display: 'block', width: '100%', marginTop: 10,
                    padding: '10px 0', borderRadius: 10, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.sub,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  {t('preview.backToDashboard')}
                </button>
              </div>
            </div>
          ) : (
            /* ── Publish form ───────────────────────── */
            <div style={cardPadded}>
              <div style={sectionTitle}>{t('preview.publishToYoutube')}</div>

              {/* Channel selector */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {t('preview.channel')}
                </div>
                {channels.isLoading ? (
                  <Skeleton height={44} rounded />
                ) : channels.isError ? (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                    background: C.surface, fontSize: 12, color: C.dim,
                  }}>
                    {t('preview.youtubeNotConnected')}{' '}
                    <button
                      onClick={() => channels.refetch()}
                      style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: 0 }}
                    >
                      {t('preview.retry')}
                    </button>
                  </div>
                ) : !channels.data?.length ? (
                  <div style={{
                    padding: '12px 14px', borderRadius: 10, border: `2px dashed ${C.border}`,
                    background: C.surface, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>{t('preview.noChannels')}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>{t('preview.noChannelsHint')}</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {channels.data.map((ch: { id: string; snippet: { title: string; thumbnails?: { default?: { url?: string } } }; statistics?: { subscriberCount?: string } }) => {
                      const isSelected = selectedChannel === ch.id;
                      return (
                        <button
                          key={ch.id}
                          onClick={() => setSelectedChannel(ch.id)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '10px 12px', borderRadius: 10,
                            border: `2px solid ${isSelected ? C.accent : C.border}`,
                            background: isSelected ? `${C.accent}08` : C.surface,
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            transition: 'all .15s',
                          }}
                        >
                          {ch.snippet?.thumbnails?.default?.url ? (
                            <Image
                              src={ch.snippet.thumbnails.default.url}
                              alt={ch.snippet.title}
                              width={32}
                              height={32}
                              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', background: C.card,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, color: C.dim, flexShrink: 0,
                            }}>
                              &#9654;
                            </div>
                          )}
                          <div style={{ flex: 1, overflow: 'hidden' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {ch.snippet.title}
                            </div>
                            {ch.statistics?.subscriberCount && (
                              <div style={{ fontSize: 10, color: C.dim, marginTop: 1 }}>
                                {Number(ch.statistics.subscriberCount).toLocaleString()} {t('preview.subscribers')}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%',
                              background: C.accent, color: '#fff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, flexShrink: 0,
                            }}>
                              &#10003;
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Visibility selector */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  {t('preview.access')}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  {PRIVACY_OPTIONS.map(opt => {
                    const isActive = privacy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setPrivacy(opt.value)}
                        title={t(opt.descKey)}
                        style={{
                          flex: 1, minWidth: isMobile ? 'calc(33% - 4px)' : 'auto', padding: '10px 4px', minHeight: 44, borderRadius: 10,
                          border: `2px solid ${isActive ? C.accent : C.border}`,
                          background: isActive ? `${C.accent}08` : C.surface,
                          cursor: 'pointer', fontFamily: 'inherit',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          transition: 'all .15s',
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{opt.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 600, color: isActive ? C.accent : C.sub }}>
                          {t(opt.labelKey)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Schedule option */}
              <div style={{ marginBottom: 18 }}>
                <button
                  onClick={() => {
                    setScheduleEnabled(!scheduleEnabled);
                    if (!scheduleEnabled) {
                      // Default to tomorrow at 12:00
                      const tomorrow = new Date(Date.now() + 86400000);
                      setScheduleDate(tomorrow.toISOString().split('T')[0] ?? '');
                      setScheduleTime('12:00');
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 0', background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${scheduleEnabled ? C.accent : C.border}`,
                    background: scheduleEnabled ? C.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s', flexShrink: 0,
                  }}>
                    {scheduleEnabled && (
                      <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, lineHeight: 1 }}>&#10003;</span>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{t('preview.schedulePublish')}</span>
                </button>

                {scheduleEnabled && (
                  <div style={{
                    paddingLeft: 26, marginTop: 8,
                    display: 'flex', gap: 8, flexWrap: 'wrap',
                  }}>
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      style={{
                        flex: '1 1 130px', padding: '8px 10px', borderRadius: 8,
                        border: `1px solid ${C.border}`, background: C.surface,
                        color: C.text, fontSize: 12, fontFamily: 'inherit',
                      }}
                    />
                    <input
                      type="time"
                      value={scheduleTime}
                      onChange={(e) => setScheduleTime(e.target.value)}
                      style={{
                        flex: '1 1 100px', padding: '8px 10px', borderRadius: 8,
                        border: `1px solid ${C.border}`, background: C.surface,
                        color: C.text, fontSize: 12, fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ width: '100%', fontSize: 11, color: C.dim, marginTop: 2 }}>
                      {t('preview.scheduleHint')}
                    </div>
                  </div>
                )}

                {!scheduleEnabled && (
                  <div style={{ fontSize: 11, color: C.dim, paddingLeft: 26, marginTop: 4 }}>
                    {t('preview.scheduleHint')}
                  </div>
                )}
              </div>

              {/* Upload progress bar */}
              {publishState === 'publishing' && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>{t('preview.uploadingToYoutube')}</span>
                    <span style={{ fontSize: 12, color: C.accent, fontWeight: 700 }}>{Math.round(publishProgress)}%</span>
                  </div>
                  <div style={{
                    height: 6, borderRadius: 3, background: C.surface, overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${publishProgress}%`, height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${C.accent}, ${C.pink})`,
                      transition: 'width .4s ease',
                    }} />
                  </div>
                </div>
              )}

              {/* Error state */}
              {publishState === 'error' && (
                <div style={{
                  padding: '10px 14px', borderRadius: 10, marginBottom: 14,
                  background: `${C.accent}10`, border: `1px solid ${C.accent}30`,
                  display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ fontSize: 14 }}>&#9888;</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>{t('preview.publishError')}</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{t('preview.publishErrorHint')}</div>
                  </div>
                  <button
                    onClick={() => { setPublishState('idle'); setPublishProgress(0); }}
                    style={{
                      padding: '6px 14px', borderRadius: 8, border: `1px solid ${C.accent}40`,
                      background: 'transparent', color: C.accent,
                      fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      flexShrink: 0, transition: 'all .15s',
                    }}
                  >
                    {t('preview.retry')}
                  </button>
                </div>
              )}

              {/* Publish button */}
              <button
                onClick={handlePublish}
                disabled={!allReady || publishState === 'publishing'}
                title={!allReady ? t('preview.completeChecklist') : undefined}
                style={{
                  width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
                  background: allReady
                    ? publishState === 'publishing'
                      ? C.dim
                      : `linear-gradient(135deg, #ff0000, ${C.accent})`
                    : C.surface,
                  color: allReady ? '#fff' : C.dim,
                  fontSize: 15, fontWeight: 700, cursor: allReady && publishState !== 'publishing' ? 'pointer' : 'not-allowed',
                  fontFamily: 'inherit',
                  boxShadow: allReady && publishState !== 'publishing' ? `0 6px 24px ${C.accent}33` : 'none',
                  transition: 'all .2s', letterSpacing: '0.01em',
                  opacity: allReady ? 1 : 0.6,
                }}
              >
                {publishState === 'publishing' ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <span style={{
                      display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.3)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'spin .8s linear infinite',
                    }} />
                    {t('preview.publishing')}
                  </span>
                ) : publishState === 'error' ? (
                  t('preview.retryPublish')
                ) : scheduleEnabled ? (
                  t('preview.scheduleBtn')
                ) : (
                  t('preview.publishBtn')
                )}
              </button>

              {!allReady && (
                <div style={{ fontSize: 11, color: C.dim, textAlign: 'center', marginTop: 6 }}>
                  {t('preview.completeChecklistHint')}
                </div>
              )}

              {/* Save to cabinet */}
              <button
                onClick={() => saveProject.mutate({ id: projectId, status: 'READY' })}
                disabled={saveProject.isPending}
                style={{
                  width: '100%', padding: '11px 0', marginTop: 10, borderRadius: 10,
                  border: `1px solid ${C.border}`, background: 'transparent',
                  color: C.text, fontSize: 13, fontWeight: 600,
                  cursor: saveProject.isPending ? 'wait' : 'pointer',
                  fontFamily: 'inherit', transition: 'all .15s',
                  opacity: saveProject.isPending ? 0.6 : 1,
                }}
                onMouseEnter={e => { if (!saveProject.isPending) e.currentTarget.style.borderColor = C.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; }}
              >
                {saveProject.isPending ? t('preview.savingProject') : t('preview.saveProject')}
              </button>
            </div>
          )}

          {/* ── YouTube preview card ──────────────── */}
          <div style={{
            ...cardStyle, padding: 0,
            background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
          }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ ...sectionTitle, marginBottom: 0 }}>{t('preview.youtubePreview')}</div>
            </div>
            <div style={{ padding: 16 }}>
              {/* Mini YouTube preview */}
              <div style={{
                borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}`,
                background: '#0f0f0f',
              }}>
                {/* Thumbnail */}
                <div style={{ aspectRatio: '16/9', background: '#1a1a1a', position: 'relative' }}>
                  {p.thumbnailUrl ? (
                    <Image src={p.thumbnailUrl} alt="Video thumbnail" fill style={{ objectFit: 'cover' }} unoptimized />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%',
                      background: `linear-gradient(135deg, ${C.purple}20, ${C.blue}20)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 20, opacity: 0.2, color: '#fff' }}>&#9654;</span>
                    </div>
                  )}
                  {totalDuration > 0 && (
                    <div style={{
                      position: 'absolute', bottom: 6, right: 6,
                      background: 'rgba(0,0,0,.85)', borderRadius: 4,
                      padding: '1px 5px', fontSize: 10, fontWeight: 700, color: '#fff',
                    }}>
                      {fmtTime(totalDuration)}
                    </div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: '10px 12px' }}>
                  <div style={{
                    fontSize: 13, fontWeight: 600, color: '#f1f1f1', lineHeight: 1.3,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', marginBottom: 6,
                  }}>
                    {p.title || t('preview.untitled')}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>
                    {t('preview.views')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Spinner keyframe (injected once) ────────── */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
