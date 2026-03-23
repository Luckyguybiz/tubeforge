'use client';

import { useState, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

const QUICK_PROMPTS = [
  { label: 'Neon City', prompt: 'futuristic neon city at night, cyberpunk atmosphere, glowing lights' },
  { label: 'Dark Gradient', prompt: 'dark dramatic gradient background, deep blue to black, moody cinematic' },
  { label: 'Fiery', prompt: 'fire and flames background, intense orange and red, dramatic' },
  { label: 'Space', prompt: 'outer space with galaxies and nebulae, deep cosmos, stars' },
  { label: 'Nature', prompt: 'lush green forest with sunbeams breaking through, golden hour' },
  { label: 'Abstract', prompt: 'abstract colorful geometric shapes, modern art, vibrant gradients' },
  { label: 'Studio', prompt: 'professional photography studio backdrop, soft gradient, clean' },
  { label: 'Tech', prompt: 'digital technology grid, circuit board patterns, blue glowing' },
];

export function AIBackgroundPanel() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [prompt, setPrompt] = useState('');
  const canvasBgImage = useThumbnailStore((s) => s.canvasBgImage);

  const generateMutation = trpc.ai.generateImage.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        useThumbnailStore.getState().setCanvasBgImage(data.url);
        toast.success(t('thumbs.aiBg.success'));
      }
    },
    onError: (err) => {
      toast.error(err.message || t('thumbs.aiBg.error'));
    },
  });

  const handleGenerate = useCallback((bgPrompt: string) => {
    if (!bgPrompt.trim()) return;
    generateMutation.mutate({
      prompt: `Background for YouTube thumbnail: ${bgPrompt}. No text, no people, just background.`,
      style: 'realistic',
      size: '1792x1024',
    });
  }, [generateMutation]);

  const handleClearBg = useCallback(() => {
    useThumbnailStore.getState().setCanvasBgImage(null);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Description */}
      <p style={{ fontSize: 11, color: C.sub, margin: 0, lineHeight: 1.5 }}>
        {t('thumbs.aiBg.description')}
      </p>

      {/* Custom prompt input */}
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate(prompt); }}
          placeholder={t('thumbs.aiBg.placeholder')}
          aria-label={t('thumbs.aiBg.placeholder')}
          style={{
            flex: 1,
            padding: '8px 10px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        <button
          onClick={() => handleGenerate(prompt)}
          disabled={generateMutation.isPending || !prompt.trim()}
          aria-label={t('thumbs.aiBg.generate')}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: 'none',
            background: generateMutation.isPending ? C.surface : C.accent,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: generateMutation.isPending ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
            opacity: !prompt.trim() ? 0.5 : 1,
          }}
        >
          {generateMutation.isPending ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          )}
        </button>
      </div>

      {/* Loading indicator */}
      {generateMutation.isPending && (
        <div style={{
          padding: '12px 0',
          textAlign: 'center',
          fontSize: 11,
          color: C.sub,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          {t('thumbs.aiBg.generating')}
        </div>
      )}

      {/* Quick prompts */}
      <div>
        <h4 style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8, marginTop: 0 }}>
          {t('thumbs.aiBg.quickPrompts')}
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {QUICK_PROMPTS.map((qp) => (
            <button
              key={qp.label}
              onClick={() => handleGenerate(qp.prompt)}
              disabled={generateMutation.isPending}
              style={{
                padding: '8px 8px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: 10,
                fontWeight: 600,
                cursor: generateMutation.isPending ? 'wait' : 'pointer',
                fontFamily: 'inherit',
                transition: 'all .12s',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.accent;
                (e.currentTarget as HTMLElement).style.background = C.accentDim;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.border;
                (e.currentTarget as HTMLElement).style.background = C.surface;
              }}
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current background preview */}
      {canvasBgImage && (
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8, marginTop: 0 }}>
            {t('thumbs.aiBg.current')}
          </h4>
          <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
            <img
              src={canvasBgImage}
              alt="Current AI background"
              loading="lazy"
              style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }}
            />
            <button
              onClick={handleClearBg}
              title={t('thumbs.aiBg.remove')}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 24,
                height: 24,
                borderRadius: 6,
                border: 'none',
                background: 'rgba(0,0,0,.6)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
