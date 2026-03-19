/**
 * Tests for OnboardingTour component
 *
 * The enhanced OnboardingTour now uses tRPC (user.getProfile, user.completeOnboarding)
 * and next-auth for session data. We mock all external dependencies.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ── Mocks ─────────────────────────────────────────────────────────── */

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: (selector: (s: unknown) => unknown) =>
    selector({
      theme: {
        accent: '#7c5cfc',
        pink: '#ec4899',
        surface: '#16162a',
        border: '#23233a',
        text: '#e4e4ed',
        sub: '#7c7c96',
        dim: '#4a4a64',
        accentDim: 'rgba(124,92,252,.08)',
      },
      isDark: true,
    }),
}));

vi.mock('@/lib/constants', () => ({
  Z_INDEX: {
    ONBOARDING_OVERLAY: 10000,
    ONBOARDING_SPOTLIGHT: 10001,
  },
}));

const ruTranslations: Record<string, string> = {
  'onboarding.welcomeTitle': 'Добро пожаловать, {name}!',
  'onboarding.welcomeDesc': 'Ваша ИИ-студия для YouTube.',
  'onboarding.sidebarTitle': 'Навигация',
  'onboarding.sidebarDesc': 'Используйте боковое меню.',
  'onboarding.newProjectTitle': 'Создайте первый проект',
  'onboarding.newProjectDesc': 'Нажмите «Новый проект».',
  'onboarding.toolsTitle': 'Бесплатные инструменты',
  'onboarding.toolsDesc': 'Конвертируйте видео в MP3.',
  'onboarding.billingTitle': 'Расширьте возможности',
  'onboarding.billingDesc': 'Обновите план.',
  'onboarding.doneTitle': 'Всё готово!',
  'onboarding.doneDesc': 'Вы готовы к работе.',
  'onboarding.next': 'Далее',
  'onboarding.start': 'Начать создавать',
  'onboarding.back': 'Назад',
  'onboarding.skip': 'Пропустить',
  'onboarding.stepOf': '{current} из {total}',
};

vi.mock('@/stores/useLocaleStore', () => ({
  useLocaleStore: (selector: (s: unknown) => unknown) =>
    selector({
      locale: 'ru',
      t: (key: string) => ruTranslations[key] ?? key,
    }),
}));

// Mock next-auth session
const mockSession = {
  data: { user: { id: 'user1', name: 'Test User', plan: 'FREE', role: 'USER' } },
  status: 'authenticated',
};
vi.mock('next-auth/react', () => ({
  useSession: () => mockSession,
}));

// Mock tRPC hooks
const mockMutate = vi.fn();
let mockProfileData: { onboardingDone: boolean } | undefined = { onboardingDone: false };

vi.mock('@/lib/trpc', () => ({
  trpc: {
    user: {
      getProfile: {
        useQuery: () => ({
          data: mockProfileData,
          isLoading: false,
        }),
      },
      completeOnboarding: {
        useMutation: () => ({
          mutate: mockMutate,
          isPending: false,
        }),
      },
    },
  },
}));

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

describe('OnboardingTour', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProfileData = { onboardingDone: false };
  });

  it('should show the tour when onboardingDone is false', () => {
    render(<OnboardingTour />);
    expect(screen.getByText('Добро пожаловать, Test User!')).toBeDefined();
  });

  it('should not show the tour when onboardingDone is true', () => {
    mockProfileData = { onboardingDone: true };
    const { container } = render(<OnboardingTour />);
    expect(container.innerHTML).toBe('');
  });

  it('should show first step initially with step indicator', () => {
    render(<OnboardingTour />);
    expect(screen.getByText('Добро пожаловать, Test User!')).toBeDefined();
    expect(screen.getByText('1 из 6')).toBeDefined();
  });

  it('should advance to next step when Далее is clicked', () => {
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Далее'));
    expect(screen.getByText('Навигация')).toBeDefined();
    expect(screen.getByText('2 из 6')).toBeDefined();
  });

  it('should show Назад button on second step', () => {
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Далее'));
    expect(screen.getByText('Назад')).toBeDefined();
  });

  it('should go back when Назад is clicked', () => {
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Далее'));
    fireEvent.click(screen.getByText('Назад'));
    expect(screen.getByText('Добро пожаловать, Test User!')).toBeDefined();
  });

  it('should show Начать создавать on last step', () => {
    render(<OnboardingTour />);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Далее'));
    }
    expect(screen.getByText('Начать создавать')).toBeDefined();
    expect(screen.getByText('Всё готово!')).toBeDefined();
  });

  it('should call completeOnboarding mutation when finishing', () => {
    const { container } = render(<OnboardingTour />);
    for (let i = 0; i < 5; i++) {
      fireEvent.click(screen.getByText('Далее'));
    }
    fireEvent.click(screen.getByText('Начать создавать'));
    expect(mockMutate).toHaveBeenCalled();
    expect(container.innerHTML).toBe('');
  });

  it('should close and call mutation when Пропустить is clicked', () => {
    const { container } = render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Пропустить'));
    expect(mockMutate).toHaveBeenCalled();
    expect(container.innerHTML).toBe('');
  });

  it('should close on Escape key', () => {
    const { container } = render(<OnboardingTour />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockMutate).toHaveBeenCalled();
    expect(container.innerHTML).toBe('');
  });

  it('should advance on ArrowRight key', () => {
    render(<OnboardingTour />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Навигация')).toBeDefined();
  });

  it('should go back on ArrowLeft key', () => {
    render(<OnboardingTour />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('Добро пожаловать, Test User!')).toBeDefined();
  });

  it('should advance on Enter key', () => {
    render(<OnboardingTour />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByText('Навигация')).toBeDefined();
  });

  it('should have accessible dialog role', () => {
    render(<OnboardingTour />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('should respond to replay event', () => {
    mockProfileData = { onboardingDone: true };
    const { container } = render(<OnboardingTour />);
    expect(container.innerHTML).toBe('');

    // Dispatch replay event
    act(() => {
      window.dispatchEvent(new Event('tubeforge:replay-onboarding'));
    });

    expect(screen.getByText('Добро пожаловать, Test User!')).toBeDefined();
  });
});
