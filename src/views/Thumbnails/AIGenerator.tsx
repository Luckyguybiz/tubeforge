'use client';

import { useState, useEffect } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { useShallow } from 'zustand/react/shallow';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { uid } from '@/lib/utils';
import { STICKY_NOTE_COLOR, STICKY_NOTE_TEXT_COLOR } from '@/lib/constants';

const STYLE_MAP = [
  { labelKey: 'thumbs.ai.styleRealism', id: 'realistic', descKey: 'thumbs.ai.descRealism' },
  { labelKey: 'thumbs.ai.styleAnime', id: 'anime', descKey: 'thumbs.ai.descAnime' },
  { labelKey: 'thumbs.ai.styleCinematic', id: 'cinematic', descKey: 'thumbs.ai.descCinematic' },
  { labelKey: 'thumbs.ai.styleMinimalist', id: 'minimalist', descKey: 'thumbs.ai.descMinimalist' },
  { labelKey: 'thumbs.ai.style3d', id: '3d', descKey: 'thumbs.ai.desc3d' },
  { labelKey: 'thumbs.ai.stylePopart', id: 'popart', descKey: 'thumbs.ai.descPopart' },
] as const;

const PROMPT_EXAMPLE_KEYS = [
  'thumbs.ai.example1',
  'thumbs.ai.example2',
  'thumbs.ai.example3',
];

export function AIGeneratorView({ projectId }: { projectId: string | null }) {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  const { els, canvasBg, canvasW, canvasH, aiPrompt, aiResults, aiStyle, aiCount, aiReferenceImage } = useThumbnailStore(
    useShallow((s) => ({ els: s.els, canvasBg: s.canvasBg, canvasW: s.canvasW, canvasH: s.canvasH, aiPrompt: s.aiPrompt, aiResults: s.aiResults, aiStyle: s.aiStyle, aiCount: s.aiCount, aiReferenceImage: s.aiReferenceImage }))
  );
  const { setAiPrompt, setStep, setAiResults, setAiStyle, setAiCount, setAiReferenceImage, addImage } = useThumbnailStore.getState();

  const generate = trpc.ai.generateThumbnail.useMutation({
    onSuccess: (data) => {
      const results = data.images.map((img: { url: string }, i: number) => ({
        id: uid(),
        url: img.url,
        label: `${t('thumbs.ai.variant')} ${i + 1}`,
      }));
      setAiResults(results);
      toast.success(t('thumbs.ai.generated'));
    },
    onError: (err) => toast.error(err.message),
  });

  const generateFromImage = trpc.ai.generateFromImage.useMutation({
    onSuccess: (data) => {
      const results = data.images.map((img: { url: string }, i: number) => ({
        id: uid(),
        url: img.url,
        label: `${t('thumbs.ai.fromPhoto')} ${i + 1}`,
      }));
      setAiResults(results);
      toast.success(t('thumbs.ai.generatedFromPhoto'));
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = () => {
    if (aiReferenceImage) {
      // Generate from canvas reference
      generateFromImage.mutate({
        imageBase64: aiReferenceImage,
        prompt: aiPrompt,
        style: aiStyle as 'realistic' | 'anime' | 'cinematic' | 'minimalist' | '3d' | 'popart',
      });
    } else {
      // Generate from text prompt
      if (!aiPrompt.trim()) return;
      generate.mutate({
        prompt: aiPrompt,
        style: aiStyle as 'realistic' | 'anime' | 'cinematic' | 'minimalist' | '3d' | 'popart',
        count: aiCount,
      });
    }
  };

  const handleSelect = (url: string) => {
    addImage(url);
    setAiReferenceImage(null);
    setStep('editor');
    toast.success(t('thumbs.ai.addedToCanvas'));
  };

  const isLoading = generate.isPending || generateFromImage.isPending;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isMobile ? 14 : 20, flexWrap: 'wrap' }}>
        <button onClick={() => { setStep('editor'); setAiReferenceImage(null); }} aria-label={t('thumbs.ai.backLabel')} style={{ padding: isMobile ? '10px 14px' : '8px 16px', minHeight: 44, borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>&larr; {t('thumbs.ai.backToEditor')}</button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            {aiReferenceImage ? `\uD83D\uDCF7 ${t('thumbs.ai.titleFromPhoto')}` : `\u2728 ${t('thumbs.ai.titleGenerate')}`}
          </h2>
          <p style={{ color: C.sub, fontSize: 12, margin: 0 }}>
            {aiReferenceImage ? t('thumbs.ai.subtitleFromPhoto') : t('thumbs.ai.subtitleGenerate')}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: isMobile ? 14 : 20, flexDirection: isMobile ? 'column' : 'row' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Reference image or canvas preview */}
          <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
            {aiReferenceImage ? t('thumbs.ai.canvasSnapshot') : t('thumbs.ai.editorReference')}
          </div>
          {aiReferenceImage ? (
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <img
                src={aiReferenceImage}
                alt={t('thumbs.ai.canvasRef')}
                style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.border}` }}
              />
              <button
                onClick={() => setAiReferenceImage(null)}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  padding: '4px 10px', borderRadius: 6, border: 'none',
                  background: 'rgba(0,0,0,.6)', color: '#fff',
                  fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {t('thumbs.ai.removeRef')}
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: `${canvasW}/${canvasH}`, background: canvasBg, borderRadius: 12, border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
              {els.map((el) => {
                if (el.type === 'text') return <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', fontSize: (el.size ?? 32) * 0.5 + 'px', fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal', fontFamily: el.font, color: el.color, textShadow: el.shadow !== 'none' ? el.shadow : 'none', opacity: el.opacity, background: el.bg, borderRadius: el.borderR, padding: '2px 4px', whiteSpace: 'nowrap' }}>{el.text}</div>;
                if (el.type === 'rect') return <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.color, opacity: el.opacity, borderRadius: el.borderR }} />;
                if (el.type === 'circle') return <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.color, opacity: el.opacity, borderRadius: '50%' }} />;
                if (el.type === 'image') return <img key={el.id} src={el.src} alt={t('thumbs.ai.imageAlt')} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', opacity: el.opacity, borderRadius: el.borderR, objectFit: 'cover' }} />;
                if (el.type === 'path') return <svg key={el.id} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${canvasW} ${canvasH}`}><path d={el.path} fill="none" stroke={el.color} strokeWidth={el.strokeW} strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity} /></svg>;
                if (el.type === 'stickyNote') return <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.noteColor ?? STICKY_NOTE_COLOR, borderRadius: 4, padding: '4px 6px', fontSize: 8, color: STICKY_NOTE_TEXT_COLOR, opacity: el.opacity }}>{el.noteText ?? t('thumbs.ai.noteDefault')}</div>;
                return null;
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
            <input
              value={aiPrompt}
              maxLength={1000}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={aiReferenceImage ? t('thumbs.ai.placeholderRef') : t('thumbs.ai.placeholderPrompt')}
              aria-label={t('thumbs.ai.promptLabel')}
              style={{ flex: 1, minWidth: 0, width: '100%', padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' as const }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || (!aiReferenceImage && !aiPrompt.trim())}
              style={{
                padding: isMobile ? '10px 16px' : '10px 24px', borderRadius: 8, minHeight: 44, flexShrink: 0, width: isMobile ? '100%' : 'auto',
                border: isLoading ? `1px solid ${C.border}` : 'none',
                background: isLoading ? 'transparent' : `linear-gradient(135deg,${C.accent},${C.pink})`,
                color: isLoading ? C.sub : '#fff',
                fontSize: 13, fontWeight: 700,
                cursor: isLoading ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {isLoading ? t('thumbs.ai.generating') : aiReferenceImage ? `\uD83D\uDCF7 ${t('thumbs.ai.createFromPhoto')}` : `\u2728 ${t('thumbs.ai.create')}`}
            </button>
          </div>
          {/* Prompt examples */}
          {!aiReferenceImage && !aiPrompt && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {PROMPT_EXAMPLE_KEYS.map((key) => {
                const ex = t(key);
                return (
                <button key={key} onClick={() => setAiPrompt(ex)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.sub, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
                  {ex}
                </button>
                );
              })}
            </div>
          )}
          {aiResults.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 8 }}>{t('thumbs.ai.results')}</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {aiResults.map((r) => (
                  <div key={r.id} style={{ width: isMobile ? '100%' : 'calc(50% - 5px)', aspectRatio: '16/9', background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                    {r.url ? (
                      <img src={r.url} alt={r.label} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${C.accent}08,${C.purple}08)` }} />
                        <div style={{ textAlign: 'center', zIndex: 1 }}><div style={{ fontSize: 24, opacity: .3, marginBottom: 4 }}>✨</div><div style={{ fontSize: 11, color: C.sub }}>{r.label}</div></div>
                      </>
                    )}
                    <button onClick={() => r.url && handleSelect(r.url)} style={{ position: 'absolute', bottom: 8, right: 8, padding: '4px 10px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{t('thumbs.ai.select')}</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ width: isMobile ? '100%' : 240, maxWidth: isMobile ? '100%' : 240, flexShrink: 0 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>{t('thumbs.ai.settings')}</div>
            <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>{t('thumbs.ai.styleLabel')}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {STYLE_MAP.map((s) => <button key={s.id} onClick={() => setAiStyle(s.id)} title={t(s.descKey)} aria-label={t('thumbs.ai.styleLabelPrefix') + t(s.labelKey)} aria-pressed={aiStyle === s.id} style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${aiStyle === s.id ? C.accent + '55' : C.border}`, background: aiStyle === s.id ? C.accentDim : C.surface, color: aiStyle === s.id ? C.accent : C.sub, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: aiStyle === s.id ? 600 : 400, display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', gap: 1 }}><span>{t(s.labelKey)}</span><span style={{ fontSize: 8, opacity: 0.7 }}>{t(s.descKey)}</span></button>)}
              </div>
            </div>
            {!aiReferenceImage && (
              <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>{t('thumbs.ai.variantCount')}</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[2, 4, 6].map((n) => <button key={n} onClick={() => setAiCount(n)} style={{ flex: 1, padding: '4px', borderRadius: 6, border: `1px solid ${C.border}`, background: aiCount === n ? C.accentDim : C.surface, color: aiCount === n ? C.accent : C.sub, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{n}<span style={{ fontSize: 8, color: C.dim, marginLeft: 2 }}>{n === 2 ? t('thumbs.ai.fast') : n === 4 ? '' : t('thumbs.ai.slow')}</span></button>)}
                </div>
              </div>
            )}
            {aiReferenceImage && (
              <div style={{ marginTop: 10, padding: '8px 10px', background: `${C.accent}0a`, border: `1px solid ${C.accent}22`, borderRadius: 8, fontSize: 10, color: C.sub, lineHeight: 1.4 }}>
                {t('thumbs.ai.visionNote')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
