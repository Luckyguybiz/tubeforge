'use client';

import { useState, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { useThumbnailStore } from '@/stores/useThumbnailStore';
import { THUMBNAIL_TEMPLATES, TEMPLATE_CATEGORIES } from '@/lib/thumbnail-templates';
import type { TemplateCategory } from '@/lib/thumbnail-templates';

export function TemplatesPanel() {
  const C = useThemeStore((s) => s.theme);
  const applyTemplate = useThumbnailStore.getState().applyTemplate;
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all');
  const [confirmTemplate, setConfirmTemplate] = useState<string | null>(null);

  const filtered = activeCategory === 'all'
    ? THUMBNAIL_TEMPLATES
    : THUMBNAIL_TEMPLATES.filter((t) => t.category === activeCategory);

  const handleApply = useCallback((templateId: string) => {
    const template = THUMBNAIL_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    applyTemplate(template.elements, template.canvasBg);
    setConfirmTemplate(null);
  }, [applyTemplate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Category filter pills */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveCategory('all')}
          style={{
            padding: '4px 10px',
            borderRadius: 20,
            border: `1px solid ${activeCategory === 'all' ? C.accent + '55' : C.border}`,
            background: activeCategory === 'all' ? C.accent + '18' : 'transparent',
            color: activeCategory === 'all' ? C.accent : C.sub,
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all .12s',
          }}
        >
          All
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '4px 10px',
              borderRadius: 20,
              border: `1px solid ${activeCategory === cat.id ? C.accent + '55' : C.border}`,
              background: activeCategory === cat.id ? C.accent + '18' : 'transparent',
              color: activeCategory === cat.id ? C.accent : C.sub,
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .12s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Template grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {filtered.map((template) => (
          <div key={template.id} style={{ position: 'relative' }}>
            <button
              onClick={() => setConfirmTemplate(template.id)}
              style={{
                width: '100%',
                padding: 0,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                background: C.surface,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all .15s',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.accent + '66';
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = C.border;
                (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              }}
              title={template.name}
            >
              {/* Mini preview */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  background: template.preview.bg,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Render mini layout elements */}
                {template.elements.slice(0, 4).map((el, i) => {
                  if (el.type === 'text') {
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${(el.x / 1280) * 100}%`,
                          top: `${(el.y / 720) * 100}%`,
                          width: `${(el.w / 1280) * 100}%`,
                          fontSize: Math.max(4, (el.size ?? 32) * 0.06),
                          fontWeight: el.bold ? 'bold' : 'normal',
                          fontStyle: el.italic ? 'italic' : 'normal',
                          color: el.color ?? '#fff',
                          opacity: el.opacity ?? 1,
                          textAlign: (el.textAlign as React.CSSProperties['textAlign']) ?? 'left',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.1,
                          letterSpacing: el.letterSpacing ? el.letterSpacing * 0.06 : undefined,
                          filter: el.glow ? `drop-shadow(0 0 ${Math.max(1, el.glow.blur * 0.1)}px ${el.glow.color})` : undefined,
                        }}
                      >
                        {(el.text ?? '').split('\n')[0]}
                      </div>
                    );
                  }
                  if (el.type === 'rect') {
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${(el.x / 1280) * 100}%`,
                          top: `${(el.y / 720) * 100}%`,
                          width: `${(el.w / 1280) * 100}%`,
                          height: `${(el.h / 720) * 100}%`,
                          background: el.color ?? '#fff',
                          opacity: el.opacity ?? 1,
                          borderRadius: el.borderR ? el.borderR * 0.1 : 0,
                        }}
                      />
                    );
                  }
                  if (el.type === 'circle') {
                    return (
                      <div
                        key={i}
                        style={{
                          position: 'absolute',
                          left: `${(el.x / 1280) * 100}%`,
                          top: `${(el.y / 720) * 100}%`,
                          width: `${(el.w / 1280) * 100}%`,
                          height: `${(el.h / 720) * 100}%`,
                          background: el.color ?? '#fff',
                          opacity: el.opacity ?? 1,
                          borderRadius: '50%',
                        }}
                      />
                    );
                  }
                  return null;
                })}
              </div>
              {/* Template name */}
              <div
                style={{
                  padding: '5px 6px',
                  fontSize: 10,
                  fontWeight: 600,
                  color: C.text,
                  textAlign: 'left',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {template.name}
              </div>
              <div
                style={{
                  padding: '0 6px 5px',
                  fontSize: 8,
                  fontWeight: 500,
                  color: C.dim,
                  textAlign: 'left',
                  textTransform: 'capitalize',
                }}
              >
                {template.category} - {template.elements.length} elements
              </div>
            </button>

            {/* Confirm dialog overlay */}
            {confirmTemplate === template.id && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,.85)',
                  borderRadius: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  zIndex: 10,
                  padding: 8,
                }}
              >
                <div style={{ fontSize: 9, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>
                  Apply template?<br />
                  <span style={{ color: 'rgba(255,255,255,.5)' }}>Replaces current canvas</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleApply(template.id); }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: C.accent,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Apply
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setConfirmTemplate(null); }}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 6,
                      border: `1px solid rgba(255,255,255,.2)`,
                      background: 'transparent',
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: C.dim, fontSize: 11, padding: '20px 0' }}>
          No templates in this category
        </div>
      )}
    </div>
  );
}
