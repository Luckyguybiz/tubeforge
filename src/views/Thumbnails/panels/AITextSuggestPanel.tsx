'use client';

import { useState, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { trpc } from '@/lib/trpc';
import { toast } from '@/stores/useNotificationStore';

export function AITextSuggestPanel() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const [context, setContext] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const suggestMutation = trpc.ai.suggestThumbnailText.useMutation({
    onSuccess: (data) => {
      if (data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
      } else {
        toast.info(t('thumbs.aiText.noSuggestions'));
      }
    },
    onError: (err) => {
      toast.error(err.message || t('thumbs.aiText.error'));
    },
  });

  const handleSuggest = useCallback(() => {
    suggestMutation.mutate({ context: context.trim() || undefined });
  }, [suggestMutation, context]);

  const handleApplySuggestion = useCallback((text: string) => {
    const store = useThumbnailStore.getState();
    const { selIds, els } = store;

    // If a text element is selected, update it
    const selectedTextEl = els.find((el) => selIds.includes(el.id) && el.type === 'text');
    if (selectedTextEl) {
      store.pushHistory();
      store.updEl(selectedTextEl.id, { text });
      toast.success(t('thumbs.aiText.applied'));
      return;
    }

    // Otherwise, create a new text element with this text
    store.addText();
    const newEls = useThumbnailStore.getState().els;
    const lastEl = newEls[newEls.length - 1];
    if (lastEl) {
      store.updEl(lastEl.id, { text, bold: true, size: 64, color: '#ffffff' });
    }
    toast.success(t('thumbs.aiText.added'));
  }, [t]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Description */}
      <p style={{ fontSize: 11, color: C.sub, margin: 0, lineHeight: 1.5 }}>
        {t('thumbs.aiText.description')}
      </p>

      {/* Context input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <input
          type="text"
          value={context}
          onChange={(e) => setContext(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSuggest(); }}
          placeholder={t('thumbs.aiText.placeholder')}
          aria-label={t('thumbs.aiText.placeholder')}
          style={{
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: `1px solid ${C.border}`,
            background: C.surface,
            color: C.text,
            fontSize: 12,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <button
          onClick={handleSuggest}
          disabled={suggestMutation.isPending}
          style={{
            width: '100%',
            padding: '9px 0',
            borderRadius: 8,
            border: 'none',
            background: suggestMutation.isPending ? C.surface : C.accent,
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            cursor: suggestMutation.isPending ? 'wait' : 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          {suggestMutation.isPending ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              {t('thumbs.aiText.generating')}
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
              </svg>
              {t('thumbs.aiText.suggest')}
            </>
          )}
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div>
          <h4 style={{ fontSize: 11, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8, marginTop: 0 }}>
            {t('thumbs.aiText.suggestions')}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleApplySuggestion(suggestion)}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  color: C.text,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'all .12s',
                  letterSpacing: '.02em',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.accent;
                  (e.currentTarget as HTMLElement).style.background = C.accentDim;
                  (e.currentTarget as HTMLElement).style.color = C.accent;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = C.border;
                  (e.currentTarget as HTMLElement).style.background = C.surface;
                  (e.currentTarget as HTMLElement).style.color = C.text;
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 10, color: C.dim, marginTop: 8, marginBottom: 0, textAlign: 'center' }}>
            {t('thumbs.aiText.clickToApply')}
          </p>
        </div>
      )}

      {/* Hint */}
      <div style={{
        padding: '8px 10px',
        borderRadius: 8,
        background: `${C.accent}08`,
        border: `1px solid ${C.accent}15`,
        fontSize: 10,
        color: C.dim,
        lineHeight: 1.5,
      }}>
        {t('thumbs.aiText.hint')}
      </div>

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
