'use client';

import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { useShallow } from 'zustand/react/shallow';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';
import { uid } from '@/lib/utils';
import { STICKY_NOTE_COLOR, STICKY_NOTE_TEXT_COLOR } from '@/lib/constants';

const STYLE_MAP = [
  { label: 'Реализм', id: 'realistic', desc: 'Фотореалистичный стиль' },
  { label: 'Аниме', id: 'anime', desc: 'Японская анимация' },
  { label: 'Кино', id: 'cinematic', desc: 'Кинематографичные кадры' },
  { label: 'Минимализм', id: 'minimalist', desc: 'Чистый и простой' },
  { label: '3D', id: '3d', desc: '3D-рендер' },
  { label: 'Поп-арт', id: 'popart', desc: 'Яркие краски и контрасты' },
] as const;

const PROMPT_EXAMPLES = [
  'Яркая обложка MrBeast',
  'Текст на тёмном фоне',
  'Лицо крупным планом с эмоцией',
];

export function AIGeneratorView({ projectId }: { projectId: string | null }) {
  const C = useThemeStore((s) => s.theme);
  const { els, canvasBg, canvasW, canvasH, aiPrompt, aiResults, aiStyle, aiCount, aiReferenceImage } = useThumbnailStore(
    useShallow((s) => ({ els: s.els, canvasBg: s.canvasBg, canvasW: s.canvasW, canvasH: s.canvasH, aiPrompt: s.aiPrompt, aiResults: s.aiResults, aiStyle: s.aiStyle, aiCount: s.aiCount, aiReferenceImage: s.aiReferenceImage }))
  );
  const { setAiPrompt, setStep, setAiResults, setAiStyle, setAiCount, setAiReferenceImage, addImage } = useThumbnailStore.getState();

  const generate = trpc.ai.generateThumbnail.useMutation({
    onSuccess: (data) => {
      const results = data.images.map((img: { url: string }, i: number) => ({
        id: uid(),
        url: img.url,
        label: `Вариант ${i + 1}`,
      }));
      setAiResults(results);
      toast.success('Обложки сгенерированы');
    },
    onError: (err) => toast.error(err.message),
  });

  const generateFromImage = trpc.ai.generateFromImage.useMutation({
    onSuccess: (data) => {
      const results = data.images.map((img: { url: string }, i: number) => ({
        id: uid(),
        url: img.url,
        label: `По фото ${i + 1}`,
      }));
      setAiResults(results);
      toast.success('Обложка сгенерирована по фото');
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
    toast.success('Обложка добавлена на canvas');
  };

  const isLoading = generate.isPending || generateFromImage.isPending;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => { setStep('editor'); setAiReferenceImage(null); }} aria-label="Вернуться к редактору" style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${C.border}`, background: 'transparent', color: C.text, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>&larr; Назад к редактору</button>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
            {aiReferenceImage ? '📷 Генерация по фото' : '✨ ИИ-генерация обложки'}
          </h2>
          <p style={{ color: C.sub, fontSize: 12, margin: 0 }}>
            {aiReferenceImage ? 'ИИ проанализирует ваш дизайн и создаст обложку' : 'Сгенерируйте обложку по текстовому промпту'}
          </p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        <div style={{ flex: 1 }}>
          {/* Reference image or canvas preview */}
          <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 6 }}>
            {aiReferenceImage ? 'Снимок canvas (будет проанализирован ИИ)' : 'Ваш референс из редактора'}
          </div>
          {aiReferenceImage ? (
            <div style={{ marginBottom: 16, position: 'relative' }}>
              <img
                src={aiReferenceImage}
                alt="Референс с холста"
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
                Удалить референс
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', aspectRatio: `${canvasW}/${canvasH}`, background: canvasBg, borderRadius: 12, border: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden', marginBottom: 16 }}>
              {els.map((el) => {
                if (el.type === 'text') return <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', fontSize: (el.size ?? 32) * 0.5 + 'px', fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal', fontFamily: el.font, color: el.color, textShadow: el.shadow !== 'none' ? el.shadow : 'none', opacity: el.opacity, background: el.bg, borderRadius: el.borderR, padding: '2px 4px', whiteSpace: 'nowrap' }}>{el.text}</div>;
                if (el.type === 'rect') return <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.color, opacity: el.opacity, borderRadius: el.borderR }} />;
                if (el.type === 'circle') return <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.color, opacity: el.opacity, borderRadius: '50%' }} />;
                if (el.type === 'image') return <img key={el.id} src={el.src} alt="Изображение" style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', opacity: el.opacity, borderRadius: el.borderR, objectFit: 'cover' }} />;
                if (el.type === 'path') return <svg key={el.id} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} viewBox={`0 0 ${canvasW} ${canvasH}`}><path d={el.path} fill="none" stroke={el.color} strokeWidth={el.strokeW} strokeLinecap="round" strokeLinejoin="round" opacity={el.opacity} /></svg>;
                if (el.type === 'stickyNote') return <div key={el.id} style={{ position: 'absolute', left: el.x / canvasW * 100 + '%', top: el.y / canvasH * 100 + '%', width: el.w / canvasW * 100 + '%', height: el.h / canvasH * 100 + '%', background: el.noteColor ?? STICKY_NOTE_COLOR, borderRadius: 4, padding: '4px 6px', fontSize: 8, color: STICKY_NOTE_TEXT_COLOR, opacity: el.opacity }}>{el.noteText ?? 'Заметка'}</div>;
                return null;
              })}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <input
              value={aiPrompt}
              maxLength={1000}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={aiReferenceImage ? 'Опишите пожелания...' : 'Опишите обложку...'}
              aria-label="Промпт для генерации обложки"
              style={{ flex: 1, padding: '10px 14px', background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, color: C.text, fontSize: 13, fontFamily: 'inherit' }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(); }}
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || (!aiReferenceImage && !aiPrompt.trim())}
              style={{
                padding: '10px 24px', borderRadius: 8,
                border: isLoading ? `1px solid ${C.border}` : 'none',
                background: isLoading ? 'transparent' : `linear-gradient(135deg,${C.accent},${C.pink})`,
                color: isLoading ? C.sub : '#fff',
                fontSize: 13, fontWeight: 700,
                cursor: isLoading ? 'wait' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {isLoading ? 'Генерация...' : aiReferenceImage ? '📷 Создать по фото' : '✨ Создать'}
            </button>
          </div>
          {/* Prompt examples */}
          {!aiReferenceImage && !aiPrompt && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              {PROMPT_EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => setAiPrompt(ex)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.surface, color: C.sub, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .12s' }}>
                  {ex}
                </button>
              ))}
            </div>
          )}
          {aiResults.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.sub, marginBottom: 8 }}>Результаты</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {aiResults.map((r) => (
                  <div key={r.id} style={{ width: 'calc(50% - 5px)', aspectRatio: '16/9', background: C.card, borderRadius: 10, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
                    {r.url ? (
                      <img src={r.url} alt={r.label} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <>
                        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${C.accent}08,${C.purple}08)` }} />
                        <div style={{ textAlign: 'center', zIndex: 1 }}><div style={{ fontSize: 24, opacity: .3, marginBottom: 4 }}>✨</div><div style={{ fontSize: 11, color: C.sub }}>{r.label}</div></div>
                      </>
                    )}
                    <button onClick={() => r.url && handleSelect(r.url)} style={{ position: 'absolute', bottom: 8, right: 8, padding: '4px 10px', borderRadius: 6, border: 'none', background: C.accent, color: '#fff', fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Выбрать</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <div style={{ width: 240 }}>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Настройки ИИ</div>
            <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>Стиль</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {STYLE_MAP.map((s) => <button key={s.id} onClick={() => setAiStyle(s.id)} title={s.desc} aria-label={`Стиль: ${s.label}`} aria-pressed={aiStyle === s.id} style={{ padding: '6px 8px', borderRadius: 6, border: `1px solid ${aiStyle === s.id ? C.accent + '55' : C.border}`, background: aiStyle === s.id ? C.accentDim : C.surface, color: aiStyle === s.id ? C.accent : C.sub, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit', fontWeight: aiStyle === s.id ? 600 : 400, display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-start', gap: 1 }}><span>{s.label}</span><span style={{ fontSize: 8, opacity: 0.7 }}>{s.desc}</span></button>)}
              </div>
            </div>
            {!aiReferenceImage && (
              <div style={{ marginBottom: 10 }}><div style={{ fontSize: 10, color: C.sub, marginBottom: 4 }}>Кол-во вариантов</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[2, 4, 6].map((n) => <button key={n} onClick={() => setAiCount(n)} style={{ flex: 1, padding: '4px', borderRadius: 6, border: `1px solid ${C.border}`, background: aiCount === n ? C.accentDim : C.surface, color: aiCount === n ? C.accent : C.sub, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{n}<span style={{ fontSize: 8, color: C.dim, marginLeft: 2 }}>{n === 2 ? '(быстро)' : n === 4 ? '' : '(дольше)'}</span></button>)}
                </div>
              </div>
            )}
            {aiReferenceImage && (
              <div style={{ marginTop: 10, padding: '8px 10px', background: `${C.accent}0a`, border: `1px solid ${C.accent}22`, borderRadius: 8, fontSize: 10, color: C.sub, lineHeight: 1.4 }}>
                ИИ использует GPT-4o Vision для анализа вашего дизайна, затем DALL-E 3 создаст обложку по описанию.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
