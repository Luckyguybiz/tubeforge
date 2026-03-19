'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { fmtTime, fmtDur, pluralRu } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { useRouter } from 'next/navigation';
import { useLocaleStore } from '@/stores/useLocaleStore';

type PrivacyStatus = 'public' | 'unlisted' | 'private';
type PublishState = 'idle' | 'publishing' | 'published' | 'error';

const PRIVACY_OPTIONS: { value: PrivacyStatus; labelKey: string; descKey: string; icon: string }[] = [
  { value: 'public', labelKey: 'preview.privacy.public', descKey: 'preview.privacy.publicDesc', icon: '🌍' },
  { value: 'unlisted', labelKey: 'preview.privacy.unlisted', descKey: 'preview.privacy.unlistedDesc', icon: '🔗' },
  { value: 'private', labelKey: 'preview.privacy.private', descKey: 'preview.privacy.privateDesc', icon: '🔒' },
];

/* ── Skeleton loader ─────────────────────────────────── */
function PreviewSkeleton() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Skeleton width={220} height={32} />
      <div style={{ marginTop: 8 }}><Skeleton width={340} height={16} /></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginTop: 28 }}>
        <div>
          <Skeleton width="100%" height={0} style={{ paddingBottom: '56.25%' }} rounded />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
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
  const [scheduled, setScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [publishState, setPublishState] = useState<PublishState>('idle');
  const [publishProgress, setPublishProgress] = useState(0);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
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
      toast.success(useLocaleStore.getState().t('preview.videoUploaded'));
      if (projectId) saveProject.mutate({ id: projectId, status: 'PUBLISHED' });
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
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
      setSelectedChannel(channels.data[0].id);
    }
  }, [channels.data, selectedChannel]);

  /* Cleanup progress timer on unmount */
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  /* ── Project picker ───────────────────────────────── */
  if (!projectId) {
    return <ProjectPicker target="/preview" title={t('preview.title')} />;
  }

  /* ── Loading state ────────────────────────────────── */
  if (project.isLoading) return <PreviewSkeleton />;

  /* ── Error state ──────────────────────────────────── */
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

  const p = project.data;
  if (!p) return null;

  /* ── Derived data (memoized) ─────────────────────── */
  const scenes = useMemo(() => p.scenes ?? [], [p.scenes]);
  const readyScenes = useMemo(() => scenes.filter(s => s.status === 'READY'), [scenes]);
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
  const tags = useMemo(() => (p.tags as string[]) ?? [], [p.tags]);

  /* ── Checklist (memoized) ──────────────────────────── */
  const checklist = useMemo(() => [
    { label: t('preview.checklist.videoReady'), done: scenes.length > 0 && scenes.every(s => s.status === 'READY'), href: `/editor?projectId=${projectId}`, hint: t('preview.checklist.goEditor') },
    { label: t('preview.checklist.metadataFilled'), done: (p.title?.length ?? 0) > 0 && (p.description?.length ?? 0) > 0, href: `/metadata?projectId=${projectId}`, hint: t('preview.checklist.goMetadata') },
    { label: t('preview.checklist.thumbnailCreated'), done: !!(p.thumbnailUrl || p.thumbnailData), href: `/thumbnails?projectId=${projectId}`, hint: t('preview.checklist.goThumbnails') },
    { label: t('preview.checklist.channelConnected'), done: (channels.data?.length ?? 0) > 0, href: '/dashboard', hint: t('preview.checklist.connectYoutube') },
  ], [scenes, p.title, p.description, p.thumbnailUrl, p.thumbnailData, projectId, channels.data?.length, t]);
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

  const handlePlayPause = () => {
    if (!hasVideo) return;
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handlePublish = () => {
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

    uploadVideo.mutate({
      title: p.title,
      description: p.description ?? '',
      tags,
      videoUrl,
      thumbnailUrl: p.thumbnailUrl ?? undefined,
      privacyStatus: privacy,
    });
  };

  const handleDownload = () => {
    if (!videoUrl) {
      toast.error(t('preview.noVideoDownload'));
      return;
    }
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${p.title || 'video'}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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

  /* ── RENDER ───────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard')}
            title={t('preview.backToDashboardTitle')}
            style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${C.border}`,
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
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: C.text, letterSpacing: '-0.02em' }}>
              {t('preview.title')}
            </h1>
            <p style={{ fontSize: 13, color: C.sub, margin: '2px 0 0' }}>
              {p.title || t('preview.untitled')} &middot; {pluralRu(scenes.length, 'сцена', 'сцены', 'сцен')} &middot; {fmtTime(totalDuration)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDownload}
            disabled={!hasVideo}
            title={hasVideo ? t('preview.downloadTitle') : t('preview.downloadDisabled')}
            style={{
              padding: '9px 18px', borderRadius: 10, border: `1px solid ${C.border}`,
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
        </div>
      </div>

      {/* ── Main grid ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
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
                    <img
                      src={p.thumbnailUrl}
                      alt={t('preview.thumbnailAlt')}
                      style={{
                        position: 'absolute', inset: 0, width: '100%', height: '100%',
                        objectFit: 'cover', opacity: 0.3, filter: 'blur(4px)',
                      }}
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
                display: 'flex', gap: 6, padding: '12px 16px',
                overflowX: 'auto', borderTop: `1px solid ${C.border}`,
                background: C.surface, alignItems: 'center',
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
                <img
                  src={p.thumbnailUrl}
                  alt={t('preview.thumbnailAltFull')}
                  loading="lazy"
                  style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 20 }}>

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
                  {t('preview.published')}
                </div>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>
                  {t('preview.videoSentToYoutube')}
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
                            <img
                              src={ch.snippet.thumbnails.default.url}
                              alt={ch.snippet.title}
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
                <div style={{ display: 'flex', gap: 6 }}>
                  {PRIVACY_OPTIONS.map(opt => {
                    const isActive = privacy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setPrivacy(opt.value)}
                        title={t(opt.descKey)}
                        style={{
                          flex: 1, padding: '10px 4px', borderRadius: 10,
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
                  disabled={true}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                    padding: '8px 0', background: 'none', border: 'none',
                    cursor: 'not-allowed', fontFamily: 'inherit', opacity: 0.5,
                  }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 4,
                    border: `2px solid ${C.border}`,
                    background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s', flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{t('preview.schedulePublish')}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: C.orange,
                    background: `${C.orange}15`, padding: '2px 8px',
                    borderRadius: 4, letterSpacing: 0.3, marginLeft: 4,
                  }}>
                    {t('preview.soon')}
                  </span>
                </button>
                <div style={{ fontSize: 11, color: C.dim, paddingLeft: 26, marginTop: 4 }}>
                  {t('preview.scheduleHint')}
                </div>
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
                    <img src={p.thumbnailUrl} alt="thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
