/**
 * Tests for OnboardingTour component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: (selector: (s: unknown) => unknown) =>
    selector({
      theme: {
        accent: '#7c5cfc',
        surface: '#16162a',
        border: '#23233a',
        text: '#e4e4ed',
        sub: '#7c7c96',
        dim: '#4a4a64',
        accentDim: 'rgba(124,92,252,.08)',
      },
    }),
}));

vi.mock('@/lib/constants', () => ({
  Z_INDEX: {
    ONBOARDING_OVERLAY: 10000,
    ONBOARDING_SPOTLIGHT: 10001,
  },
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';

describe('OnboardingTour', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should show the tour when onboarding is not done', () => {
    render(<OnboardingTour />);
    expect(screen.getByText('Добро пожаловать в TubeForge')).toBeDefined();
  });

  it('should not show the tour when onboarding is already done', () => {
    localStorage.setItem('tubeforge_onboarding_done', 'true');
    const { container } = render(<OnboardingTour />);
    expect(container.innerHTML).toBe('');
  });

  it('should show first step initially', () => {
    render(<OnboardingTour />);
    expect(screen.getByText('Добро пожаловать в TubeForge')).toBeDefined();
    expect(screen.getByText('1/4')).toBeDefined();
  });

  it('should advance to next step when Далее is clicked', () => {
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Далее'));
    expect(screen.getByText('Обзор дашборда')).toBeDefined();
    expect(screen.getByText('2/4')).toBeDefined();
  });

  it('should show Назад button on second step', () => {
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Далее'));
    expect(screen.getByText('Назад')).toBeDefined();
  });

  it('should go back when Назад is clicked', () => {
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Далее')); // go to step 2
    fireEvent.click(screen.getByText('Назад')); // back to step 1
    expect(screen.getByText('Добро пожаловать в TubeForge')).toBeDefined();
  });

  it('should show Начать on last step', () => {
    render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Далее')); // step 2
    fireEvent.click(screen.getByText('Далее')); // step 3
    fireEvent.click(screen.getByText('Далее')); // step 4
    expect(screen.getByText('Начать')).toBeDefined();
  });

  it('should close and save to localStorage when Начать is clicked', () => {
    const { container } = render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Далее')); // step 2
    fireEvent.click(screen.getByText('Далее')); // step 3
    fireEvent.click(screen.getByText('Далее')); // step 4
    fireEvent.click(screen.getByText('Начать'));
    expect(localStorage.getItem('tubeforge_onboarding_done')).toBe('true');
    expect(container.innerHTML).toBe('');
  });

  it('should close when Пропустить is clicked', () => {
    const { container } = render(<OnboardingTour />);
    fireEvent.click(screen.getByText('Пропустить'));
    expect(localStorage.getItem('tubeforge_onboarding_done')).toBe('true');
    expect(container.innerHTML).toBe('');
  });

  it('should close on Escape key', () => {
    const { container } = render(<OnboardingTour />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(localStorage.getItem('tubeforge_onboarding_done')).toBe('true');
    expect(container.innerHTML).toBe('');
  });

  it('should advance on ArrowRight key', () => {
    render(<OnboardingTour />);
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Обзор дашборда')).toBeDefined();
  });

  it('should go back on ArrowLeft key', () => {
    render(<OnboardingTour />);
    fireEvent.keyDown(window, { key: 'ArrowRight' }); // step 2
    fireEvent.keyDown(window, { key: 'ArrowLeft' }); // back to step 1
    expect(screen.getByText('Добро пожаловать в TubeForge')).toBeDefined();
  });

  it('should advance on Enter key', () => {
    render(<OnboardingTour />);
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(screen.getByText('Обзор дашборда')).toBeDefined();
  });

  it('should have accessible dialog role', () => {
    render(<OnboardingTour />);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeDefined();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });
});
