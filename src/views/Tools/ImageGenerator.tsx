'use client';

import { useState, useCallback, useMemo } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

const GRADIENT: [string, string] = ['#6366f1', '#8b5cf6'];

type StyleId = 'realistic' | 'anime' | '3d' | 'watercolor' | 'oil' | 'pixel' | 'minimalist' | 'cinematic';
type SizeId = '1024x1024' | '1792x1024' | '1024x1792';

interface StyleOption {
  id: StyleId;
  labelKey: string;
  icon: string;
}

interface SizeOption {
  id: SizeId;
  labelKey: string;
  ratio: string;
}

interface GeneratedImage {
  id: number;
  url: string;
  prompt: string;
  style: StyleId;
  revisedPrompt: string;
}

const STYLES: StyleOption[] = [
  { id: 'realistic', labelKey: 'imggen.style.realistic', icon: '📷' },
  { id: 'anime', labelKey: 'imggen.style.anime', icon: '🎨' },
  { id: '3d', labelKey: 'imggen.style.3d', icon: '🧊' },
  { id: 'watercolor', labelKey: 'imggen.style.watercolor', icon: '💧' },
  { id: 'oil', labelKey: 'imggen.style.oil', icon: '🖌️' },
  { id: 'pixel', labelKey: 'imggen.style.pixel', icon: '👾' },
  { id: 'minimalist', labelKey: 'imggen.style.minimalist', icon: '◻️' },
  { id: 'cinematic', labelKey: 'imggen.style.cinematic', icon: '🎬' },
];

const SIZES: SizeOption[] = [
  { id: '1024x1024', labelKey: 'imggen.size.square', ratio: '1:1' },
  { id: '1792x1024', labelKey: 'imggen.size.landscape', ratio: '16:9' },
  { id: '1024x1792', labelKey: 'imggen.size.portrait', ratio: '9:16' },
];

const EXAMPLE_PROMPT_KEYS = [
  'imggen.example.1',
  'imggen.example.2',
  'imggen.example.3',
  'imggen.example.4',
  'imggen.example.5',
  'imggen.example.6',
];

let _idCounter = 0;

export function ImageGenerator() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const { canUseAI, remainingAI, plan } = usePlanLimits();

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState<StyleId>('realistic');
  const [size, setSize] = useState<SizeId>('1024x1024');
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [activeImage, setActiveImage] = useState<GeneratedImage | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  const generate = trpc.ai.generateImage.useMutation({
    onSuccess: (data) => {
      const img: GeneratedImage = {
        id: ++_idCounter,
        url: data.url,
        prompt,
        style,
        revisedPrompt: data.revisedPrompt,
      };
      setActiveImage(img);
      setHistory((prev) => [img, ...prev].slice(0, 4));
      toast.success(t('imggen.toast.success'));
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || generate.isPending) return;
    if (!canUseAI) {
      toast.error(t('imggen.toast.limitReached'));
      return;
    }
    generate.mutate({ prompt: prompt.trim(), style, size });
  }, [prompt, style, size, generate, canUseAI, t]);

  const handleRegenerate = useCallback(() => {
    if (!activeImage || generate.isPending) return;
    if (!canUseAI) {
      toast.error(t('imggen.toast.limitReached'));
      return;
    }
    generate.mutate({ prompt: activeImage.prompt, style: activeImage.style, size });
  }, [activeImage, size, generate, canUseAI, t]);

  const handleDownload = useCallback(async () => {
    if (!activeImage) return;
    try {
      const res = await fetch(activeImage.url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tubeforge-image-${activeImage.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(activeImage.url, '_blank');
    }
  }, [activeImage]);

  const handleUseInProject = useCallback(() => {
    toast.success(t('imggen.toast.addedToLibrary'));
  }, [t]);

  const handleExampleClick = useCallback((key: string) => {
    setPrompt(t(key));
  }, [t]);

  const pillStyle = useMemo(() => (active: boolean): React.CSSProperties => ({
    padding: '8px 14px',
    minHeight: 40,
    borderRadius: 10,
    border: `1px solid ${active ? GRADIENT[0] : C.border}`,
    background: active ? `${GRADIENT[0]}22` : C.card,
    color: active ? GRADIENT[0] : C.sub,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }), [C.border, C.card, C.sub]);

  const isLoading = generate.isPending;

  return (
    <ToolPageShell
      title={t('imggen.title')}
      subtitle={t('imggen.subtitle')}
      gradient={GRADIENT}
    >
      {/* Plan limits badge */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        flexWrap: 'wrap',
        gap: 8,
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 14px',
          borderRadius: 10,
          background: canUseAI ? `${GRADIENT[0]}10` : '#ef444420',
          border: `1px solid ${canUseAI ? `${GRADIENT[0]}30` : '#ef444440'}`,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={canUseAI ? GRADIENT[0] : '#ef4444'} strokeWidth="2" strokeLinecap="round">
            <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: canUseAI ? GRADIENT[0] : '#ef4444' }}>
            {t('imggen.remaining')}: {remainingAI}
          </span>
        </div>
        {!canUseAI && (
          <a
            href="/settings#billing"
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {t('imggen.upgrade')}
          </a>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Left: Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Prompt area */}
          <div style={{
            padding: 16, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{t('imggen.prompt')}</span>
              <span style={{ fontSize: 12, color: prompt.length > 900 ? '#ef4444' : C.dim }}>
                {prompt.length}/1000
              </span>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => {
                if (e.target.value.length <= 1000) setPrompt(e.target.value);
              }}
              placeholder={t('imggen.promptPlaceholder')}
              rows={5}
              style={{
                width: '100%', minHeight: 120, padding: 14, borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 14, fontFamily: 'inherit',
                resize: 'vertical', outline: 'none',
                transition: 'border-color 0.2s ease',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>

          {/* Style selector */}
          <div style={{
            padding: 16, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>
              {t('imggen.styleLabel')}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  style={pillStyle(style === s.id)}
                >
                  <span>{s.icon}</span>
                  {t(s.labelKey)}
                </button>
              ))}
            </div>
          </div>

          {/* Size selector */}
          <div style={{
            padding: 16, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>
              {t('imggen.sizeLabel')}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SIZES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSize(s.id)}
                  style={pillStyle(size === s.id)}
                >
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{s.ratio}</span>
                  {t(s.labelKey)} ({s.id})
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <ActionButton
            label={isLoading ? t('imggen.generating') : t('imggen.generate')}
            gradient={GRADIENT}
            onClick={handleGenerate}
            loading={isLoading}
            disabled={!prompt.trim() || !canUseAI}
          />
        </div>

        {/* Right: Results area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
          {/* Main image display */}
          <div style={{
            padding: 16, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
            minHeight: 360,
          }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>
              {t('imggen.result')}
            </span>

            {isLoading ? (
              /* Loading state */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '80px 24px', borderRadius: 12,
                background: `linear-gradient(135deg, ${GRADIENT[0]}08, ${GRADIENT[1]}08)`,
                border: `1px solid ${C.border}`,
              }}>
                <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'spin 1.2s linear infinite' }}>
                  <circle cx="24" cy="24" r="18" stroke={`${GRADIENT[0]}33`} strokeWidth="3" fill="none" />
                  <path d="M24 6a18 18 0 0112.73 5.27" stroke={GRADIENT[0]} strokeWidth="3" strokeLinecap="round" fill="none" />
                </svg>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 16 }}>
                  {t('imggen.generatingHint')}
                </span>
                <span style={{ fontSize: 13, color: C.dim, marginTop: 6 }}>
                  {t('imggen.generatingTime')}
                </span>
              </div>
            ) : activeImage ? (
              /* Generated image */
              <div>
                <div style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeImage.url}
                    alt={activeImage.prompt}
                    style={{
                      width: '100%',
                      display: 'block',
                      borderRadius: 12,
                    }}
                  />
                </div>
                {activeImage.revisedPrompt && (
                  <div style={{
                    marginTop: 10, padding: '8px 12px',
                    borderRadius: 8, background: C.surface,
                    border: `1px solid ${C.border}`,
                  }}>
                    <span style={{ fontSize: 11, color: C.dim, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      {t('imggen.revisedPrompt')}
                    </span>
                    <span style={{ fontSize: 12, color: C.sub, lineHeight: 1.5 }}>
                      {activeImage.revisedPrompt}
                    </span>
                  </div>
                )}
                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button
                    onClick={handleDownload}
                    onMouseEnter={() => setHoveredBtn('download')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 10,
                      border: `1px solid ${hoveredBtn === 'download' ? GRADIENT[0] : C.border}`,
                      background: hoveredBtn === 'download' ? `${GRADIENT[0]}10` : C.surface,
                      color: hoveredBtn === 'download' ? GRADIENT[0] : C.text,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      outline: 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {t('imggen.download')}
                  </button>
                  <button
                    onClick={handleUseInProject}
                    onMouseEnter={() => setHoveredBtn('use')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    style={{
                      flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 10,
                      border: `1px solid ${hoveredBtn === 'use' ? GRADIENT[0] : C.border}`,
                      background: hoveredBtn === 'use' ? `${GRADIENT[0]}10` : C.surface,
                      color: hoveredBtn === 'use' ? GRADIENT[0] : C.text,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      outline: 'none',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {t('imggen.useInProject')}
                  </button>
                  <button
                    onClick={handleRegenerate}
                    onMouseEnter={() => setHoveredBtn('regen')}
                    onMouseLeave={() => setHoveredBtn(null)}
                    disabled={isLoading}
                    style={{
                      flex: 1, minWidth: 120, padding: '10px 16px', borderRadius: 10,
                      border: `1px solid ${hoveredBtn === 'regen' ? GRADIENT[0] : C.border}`,
                      background: hoveredBtn === 'regen' ? `${GRADIENT[0]}10` : C.surface,
                      color: hoveredBtn === 'regen' ? GRADIENT[0] : C.text,
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.2s ease', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      outline: 'none',
                      opacity: isLoading ? 0.5 : 1,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                    </svg>
                    {t('imggen.regenerate')}
                  </button>
                </div>
              </div>
            ) : (
              /* Empty state with example prompts */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '40px 24px', borderRadius: 12,
                background: C.surface, border: `1px solid ${C.border}`,
              }}>
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={`${GRADIENT[0]}44`} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
                <span style={{ fontSize: 15, fontWeight: 600, color: C.text, marginTop: 16 }}>
                  {t('imggen.emptyTitle')}
                </span>
                <span style={{ fontSize: 13, color: C.dim, marginTop: 6, textAlign: 'center', maxWidth: 300 }}>
                  {t('imggen.emptyDesc')}
                </span>

                {/* Example prompts */}
                <div style={{ marginTop: 20, width: '100%' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.dim, display: 'block', marginBottom: 8, textAlign: 'center' }}>
                    {t('imggen.examplesTitle')}
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {EXAMPLE_PROMPT_KEYS.map((key) => (
                      <button
                        key={key}
                        onClick={() => handleExampleClick(key)}
                        style={{
                          padding: '10px 14px', borderRadius: 10,
                          border: `1px solid ${C.border}`, background: C.card,
                          color: C.sub, fontSize: 13, cursor: 'pointer',
                          textAlign: 'left', fontFamily: 'inherit',
                          transition: 'all 0.2s ease', outline: 'none',
                          lineHeight: 1.4,
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; e.currentTarget.style.color = C.text; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.sub; }}
                      >
                        {t(key)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* History thumbnails */}
          {history.length > 0 && (
            <div style={{
              padding: 16, borderRadius: 16,
              border: `1px solid ${C.border}`, background: C.card,
            }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>
                {t('imggen.history')}
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {history.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImage(img)}
                    style={{
                      padding: 0, border: activeImage?.id === img.id
                        ? `2px solid ${GRADIENT[0]}`
                        : `1px solid ${C.border}`,
                      borderRadius: 10,
                      overflow: 'hidden',
                      cursor: 'pointer',
                      background: C.surface,
                      aspectRatio: '1',
                      outline: 'none',
                      transition: 'all 0.2s ease',
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
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
