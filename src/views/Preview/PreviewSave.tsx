'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { fmtTime, fmtDur, pluralRu } from '@/lib/utils';
import { Skeleton } from '@/components/ui';
import { ProjectPicker } from '@/components/ui/ProjectPicker';
import { useRouter } from 'next/navigation';

type PrivacyStatus = 'public' | 'unlisted' | 'private';
type PublishState = 'idle' | 'publishing' | 'published' | 'error';

const PRIVACY_OPTIONS: { value: PrivacyStatus; label: string; desc: string; icon: string }[] = [
  { value: 'public', label: 'Открытое', desc: 'Видно всем', icon: '🌍' },
  { value: 'unlisted', label: 'По ссылке', desc: 'Только по прямой ссылке', icon: '🔗' },
  { value: 'private', label: 'Личное', desc: 'Только вам', icon: '🔒' },
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
      toast.success('Проект сохранён');
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadVideo = trpc.youtube.uploadVideo.useMutation({
    onSuccess: (data) => {
      setPublishState('published');
      setPublishProgress(100);
      if (data.uploadUrl) setYoutubeUrl(data.uploadUrl);
      toast.success('Видео отправлено на YouTube!');
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
    return <ProjectPicker target="/preview" title="Превью и публикация" />;
  }

  /* ── Loading state ────────────────────────────────── */
  if (project.isLoading) return <PreviewSkeleton />;

  /* ── Error state ──────────────────────────────────── */
  if (project.isError) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 14 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${C.accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>!</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginTop: 4 }}>Не удалось загрузить проект</div>
        <div style={{ fontSize: 13, color: C.sub, maxWidth: 400, textAlign: 'center' }}>{project.error?.message || 'Произошла ошибка при загрузке данных. Попробуйте ещё раз.'}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <button
            onClick={() => project.refetch()}
            style={{ padding: '10px 24px', borderRadius: 10, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
          >
            Повторить
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: C.accent, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s' }}
          >
            На дашборд
          </button>
        </div>
      </div>
    );
  }

  const p = project.data;
  if (!p) return null;

  /* ── Derived data ─────────────────────────────────── */
  const scenes = p.scenes ?? [];
  const readyScenes = scenes.filter(s => s.status === 'READY');
  const scenesWithVideo = scenes.filter(s => s.videoUrl);
  const totalDuration = scenes.reduce((sum, sc) => sum + sc.duration, 0);
  const hasVideo = scenesWithVideo.length > 0;
  const currentVideoUrl = scenesWithVideo.length > 0
    ? (scenesWithVideo.find((_s, i) => {
        // Map activeSceneIdx (index in all scenes) to scenesWithVideo
        const sceneAtIdx = scenes[activeSceneIdx];
        return sceneAtIdx?.videoUrl && _s.id === sceneAtIdx.id;
      })?.videoUrl ?? scenesWithVideo[0]?.videoUrl ?? null)
    : null;
  const videoUrl = scenesWithVideo[0]?.videoUrl ?? null;
  const tags = (p.tags as string[]) ?? [];

  /* ── Checklist ────────────────────────────────────── */
  const checklist = [
    { label: 'Видео готово', done: scenes.length > 0 && scenes.every(s => s.status === 'READY'), href: `/editor?projectId=${projectId}`, hint: 'Перейти в редактор' },
    { label: 'Метаданные заполнены', done: (p.title?.length ?? 0) > 0 && (p.description?.length ?? 0) > 0, href: `/metadata?projectId=${projectId}`, hint: 'Перейти к метаданным' },
    { label: 'Обложка создана', done: !!(p.thumbnailUrl || p.thumbnailData), href: `/thumbnails?projectId=${projectId}`, hint: 'Перейти к обложкам' },
    { label: 'Канал подключён', done: (channels.data?.length ?? 0) > 0, href: '/dashboard', hint: 'Подключить YouTube' },
  ];
  const checklistDone = checklist.filter(c => c.done).length;
  const allReady = checklist.every(c => c.done);

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
    }
  }, [activeSceneIdx, scenes]);

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
      toast.warning('Заполните все пункты чеклиста перед публикацией');
      return;
    }
    if (!videoUrl) {
      toast.error('Нет готового видео для публикации');
      return;
    }
    if (!selectedChannel) {
      toast.error('Выберите канал для публикации');
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
      toast.error('Нет готового видео для скачивания');
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
  const cardStyle: React.CSSProperties = {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 16,
    overflow: 'hidden',
  };

  const cardPadded: React.CSSProperties = {
    ...cardStyle,
    padding: 20,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: C.text,
    letterSpacing: '0.01em',
    textTransform: 'uppercase' as const,
    marginBottom: 14,
  };

  /* ── RENDER ───────────────────────────────────────── */
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Header ──────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/dashboard')}
            title="Вернуться на дашборд"
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
              Превью и публикация
            </h1>
            <p style={{ fontSize: 13, color: C.sub, margin: '2px 0 0' }}>
              {p.title || 'Без названия'} &middot; {pluralRu(scenes.length, 'сцена', 'сцены', 'сцен')} &middot; {fmtTime(totalDuration)}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleDownload}
            disabled={!hasVideo}
            title={hasVideo ? 'Скачать видео на устройство' : 'Сначала сгенерируйте видео'}
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
            Скачать видео
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
                    aria-label={isPlaying ? 'Пауза' : 'Воспроизвести'}
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
                      alt="Обложка"
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
                    {scenes.length > 0 ? 'Нет готовых видео' : 'Сначала сгенерируйте видео в Редакторе'}
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
                    Открыть редактор
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
                background: C.surface,
              }}>
                {scenes.map((scene, idx) => {
                  const isActive = idx === activeSceneIdx;
                  const isReady = scene.status === 'READY';
                  const isCurrentlyPlaying = isActive && isPlaying;
                  return (
                    <button
                      key={scene.id}
                      onClick={() => {
                        setActiveSceneIdx(idx);
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          // Will auto-update via src change; pause current
                          videoRef.current.pause();
                          setIsPlaying(false);
                        }
                      }}
                      title={`Сцена ${idx + 1}: ${scene.label || 'Без названия'} (${fmtDur(scene.duration)})${isCurrentlyPlaying ? ' — воспроизводится' : ''}`}
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
              <div style={sectionTitle}>Метаданные</div>
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
                Редактировать
              </button>
            </div>

            {/* Title card */}
            <div style={{
              background: C.surface, borderRadius: 10, padding: '12px 16px', marginBottom: 10,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Название
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: p.title ? C.text : C.dim }}>
                {p.title || 'Не указано'}
              </div>
            </div>

            {/* Description card */}
            <div style={{
              background: C.surface, borderRadius: 10, padding: '12px 16px', marginBottom: 10,
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                Описание
              </div>
              <div style={{
                fontSize: 13, color: p.description ? C.sub : C.dim, lineHeight: 1.6,
                maxHeight: 80, overflow: 'hidden',
                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', display: '-webkit-box',
              }}>
                {p.description || 'Не указано'}
              </div>
            </div>

            {/* Tags card */}
            <div style={{
              background: C.surface, borderRadius: 10, padding: '12px 16px',
              border: `1px solid ${C.border}`,
            }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Теги
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
                <div style={{ fontSize: 13, color: C.dim }}>Не указаны</div>
              )}
            </div>
          </div>

          {/* ── Thumbnail preview ──────────────────── */}
          <div style={cardPadded}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={sectionTitle}>Обложка</div>
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
                Редактировать
              </button>
            </div>
            {p.thumbnailUrl ? (
              <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                <img
                  src={p.thumbnailUrl}
                  alt="Обложка видео"
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
                <div style={{ fontSize: 12, color: C.dim }}>Обложка не создана</div>
                <button
                  onClick={() => router.push(`/thumbnails?projectId=${projectId}`)}
                  style={{
                    padding: '6px 16px', borderRadius: 8, border: `1px solid ${C.border}`,
                    background: 'transparent', color: C.sub, fontSize: 11, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Создать обложку
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
              <div style={sectionTitle}>Чеклист</div>
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
                aria-label={item.done ? `${item.label} -- выполнено` : `${item.label} -- ${item.hint}`}
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
                  Опубликовано!
                </div>
                <div style={{ fontSize: 13, color: C.sub, marginBottom: 16 }}>
                  Видео отправлено на YouTube
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
                      Открыть на YouTube
                    </a>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(youtubeUrl);
                        toast.success('Ссылка скопирована');
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
                      Копировать ссылку
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
                  Вернуться на дашборд
                </button>
              </div>
            </div>
          ) : (
            /* ── Publish form ───────────────────────── */
            <div style={cardPadded}>
              <div style={sectionTitle}>Публикация на YouTube</div>

              {/* Channel selector */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  Канал
                </div>
                {channels.isLoading ? (
                  <Skeleton height={44} rounded />
                ) : channels.isError ? (
                  <div style={{
                    padding: '10px 14px', borderRadius: 10, border: `1px solid ${C.border}`,
                    background: C.surface, fontSize: 12, color: C.dim,
                  }}>
                    YouTube не подключён.{' '}
                    <button
                      onClick={() => channels.refetch()}
                      style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, padding: 0 }}
                    >
                      Повторить
                    </button>
                  </div>
                ) : !channels.data?.length ? (
                  <div style={{
                    padding: '12px 14px', borderRadius: 10, border: `2px dashed ${C.border}`,
                    background: C.surface, textAlign: 'center',
                  }}>
                    <div style={{ fontSize: 12, color: C.dim, marginBottom: 6 }}>Нет подключённых каналов</div>
                    <div style={{ fontSize: 11, color: C.dim }}>Авторизуйтесь через Google с доступом к YouTube</div>
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
                                {Number(ch.statistics.subscriberCount).toLocaleString('ru-RU')} подписчиков
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
                  Доступ
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {PRIVACY_OPTIONS.map(opt => {
                    const isActive = privacy === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setPrivacy(opt.value)}
                        title={opt.desc}
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
                          {opt.label}
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
                  <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>Запланировать публикацию</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: C.orange,
                    background: `${C.orange}15`, padding: '2px 8px',
                    borderRadius: 4, letterSpacing: 0.3, marginLeft: 4,
                  }}>
                    Скоро
                  </span>
                </button>
                <div style={{ fontSize: 11, color: C.dim, paddingLeft: 26, marginTop: 4 }}>
                  Планирование публикации будет доступно в ближайшем обновлении
                </div>
              </div>

              {/* Upload progress bar */}
              {publishState === 'publishing' && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>Загрузка на YouTube...</span>
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
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>Ошибка публикации</div>
                    <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>Проверьте подключение и попробуйте ещё раз</div>
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
                    Повторить
                  </button>
                </div>
              )}

              {/* Publish button */}
              <button
                onClick={handlePublish}
                disabled={!allReady || publishState === 'publishing'}
                title={!allReady ? 'Завершите все пункты чеклиста' : undefined}
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
                    Публикация...
                  </span>
                ) : publishState === 'error' ? (
                  'Повторить публикацию'
                ) : (
                  'Опубликовать на YouTube'
                )}
              </button>

              {!allReady && (
                <div style={{ fontSize: 11, color: C.dim, textAlign: 'center', marginTop: 6 }}>
                  Завершите все пункты чеклиста для публикации
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
                {saveProject.isPending ? 'Сохранение...' : 'Сохранить проект'}
              </button>
            </div>
          )}

          {/* ── YouTube preview card ──────────────── */}
          <div style={{
            ...cardStyle, padding: 0,
            background: `linear-gradient(135deg, ${C.card}, ${C.surface})`,
          }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ ...sectionTitle, marginBottom: 0 }}>Как будет выглядеть</div>
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
                    <img src={p.thumbnailUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                    {p.title || 'Без названия'}
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa' }}>
                    0 просмотров &middot; только что
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
