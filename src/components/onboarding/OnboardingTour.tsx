'use client';

import { useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '@/stores/useThemeStore';
import { Z_INDEX } from '@/lib/constants';

interface TourStep {
  title: string;
  description: string;
  position: 'center' | 'left' | 'main' | 'sidebar';
}

const steps: TourStep[] = [
  {
    title: 'Добро пожаловать в TubeForge',
    description:
      'Ваша ИИ-студия для YouTube. Создавайте видео, обложки и метаданные — всё в одном месте. Давайте покажем, как всё устроено!',
    position: 'center',
  },
  {
    title: 'Обзор дашборда',
    description:
      'Здесь отображается статистика канала, последние видео и быстрые действия. Всё начинается с вашего дашборда.',
    position: 'left',
  },
  {
    title: 'Создайте первый проект',
    description:
      'В основной области вы работаете над видео, редактируете метаданные и управляете проектами. Начните с создания нового проекта!',
    position: 'main',
  },
  {
    title: 'ИИ-инструменты',
    description:
      'Используйте боковое меню для доступа к ИИ-генерации видео, редактору обложек, оптимизатору метаданных и другим инструментам.',
    position: 'sidebar',
  },
];

const STORAGE_KEY = 'tubeforge_onboarding_done';

export function OnboardingTour() {
  const C = useThemeStore((s) => s.theme);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(STORAGE_KEY);
  });

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  }, []);

  const next = useCallback(() => {
    setStep((s) => (s < steps.length - 1 ? s + 1 : (complete(), s)));
  }, [complete]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  // Keyboard navigation: Escape to skip, ArrowRight/Enter to next, ArrowLeft to prev
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { skip(); return; }
      if (e.key === 'ArrowRight' || e.key === 'Enter') { next(); return; }
      if (e.key === 'ArrowLeft') { prev(); return; }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, next, prev, skip]);

  if (!visible) return null;

  const current = steps[step];

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: Z_INDEX.ONBOARDING_OVERLAY,
    background: 'rgba(0,0,0,.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  /* Position the highlight based on step */
  const highlightStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: Z_INDEX.ONBOARDING_OVERLAY,
      border: `2px solid ${C.accent}`,
      borderRadius: 16,
      pointerEvents: 'none',
      boxShadow: `0 0 0 9999px rgba(0,0,0,.55), 0 0 30px ${C.accent}44`,
      transition: 'all .3s ease',
    };
    switch (current.position) {
      case 'left':
        return { ...base, top: 60, left: 0, width: 200, height: 'calc(100vh - 60px)' };
      case 'main':
        return { ...base, top: 60, left: 210, width: 'calc(100vw - 420px)', height: 'calc(100vh - 80px)' };
      case 'sidebar':
        return { ...base, top: 0, left: 0, width: 200, height: '100vh' };
      default:
        return { ...base, display: 'none' };
    }
  })();

  const modalStyle: React.CSSProperties = (() => {
    const base: React.CSSProperties = {
      position: 'fixed',
      zIndex: Z_INDEX.ONBOARDING_SPOTLIGHT,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      padding: 32,
      width: 420,
      maxWidth: 'calc(100vw - 32px)',
      boxShadow: `0 24px 80px rgba(0,0,0,.4)`,
    };
    switch (current.position) {
      case 'center':
        return { ...base, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
      case 'left':
        return { ...base, top: '50%', left: 240, transform: 'translateY(-50%)' };
      case 'main':
        return { ...base, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
      case 'sidebar':
        return { ...base, top: '50%', left: 240, transform: 'translateY(-50%)' };
      default:
        return { ...base, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
    }
  })();

  const btnBase: React.CSSProperties = {
    padding: '10px 24px',
    borderRadius: 10,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'opacity .15s',
  };

  return (
    <>
      {/* Overlay */}
      <div style={overlayStyle} onClick={(e) => e.target === e.currentTarget && skip()} />

      {/* Highlight area */}
      {current.position !== 'center' && <div style={highlightStyle} aria-hidden="true" />}

      {/* Modal */}
      <div role="dialog" aria-modal="true" aria-labelledby="onboarding-title" style={modalStyle}>
        {/* Step counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background: i === step ? C.accent : C.border,
                  transition: 'all .2s',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>
            {step + 1}/{steps.length}
          </span>
        </div>

        {/* Content */}
        <h2 id="onboarding-title" style={{ fontSize: 22, fontWeight: 700, marginBottom: 10, color: C.text }}>
          {current.title}
        </h2>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub, marginBottom: 28 }}>
          {current.description}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={skip}
            style={{ ...btnBase, background: 'transparent', color: C.dim, padding: '10px 16px' }}
          >
            Пропустить
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button
                onClick={prev}
                style={{ ...btnBase, background: C.surface, color: C.sub, border: `1px solid ${C.border}` }}
              >
                Назад
              </button>
            )}
            <button
              onClick={next}
              style={{ ...btnBase, background: C.accent, color: '#fff' }}
            >
              {step < steps.length - 1 ? 'Далее' : 'Начать'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
