/**
 * Tests for Toast component
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: (selector: (s: unknown) => unknown) =>
    selector({
      theme: {
        card: '#1a1a32',
        border: '#23233a',
        text: '#e4e4ed',
        sub: '#7c7c96',
        green: '#22c55e',
        accent: '#7c5cfc',
        blue: '#3b82f6',
        orange: '#f59e0b',
      },
    }),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toast } from '@/components/ui/Toast';

describe('Toast', () => {
  const defaultProps = {
    id: 'toast-1',
    type: 'success' as const,
    message: 'Операция выполнена!',
    onClose: vi.fn(),
  };

  it('should render the message text', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Операция выполнена!')).toBeDefined();
  });

  it('should use role="status" for non-error toasts', () => {
    const { container } = render(<Toast {...defaultProps} type="success" />);
    expect(container.querySelector('[role="status"]')).toBeTruthy();
  });

  it('should use role="alert" for error toasts', () => {
    const { container } = render(<Toast {...defaultProps} type="error" />);
    expect(container.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('should use role="status" for info toasts', () => {
    const { container } = render(<Toast {...defaultProps} type="info" />);
    expect(container.querySelector('[role="status"]')).toBeTruthy();
  });

  it('should use role="status" for warning toasts', () => {
    const { container } = render(<Toast {...defaultProps} type="warning" />);
    expect(container.querySelector('[role="status"]')).toBeTruthy();
  });

  it('should call onClose with id when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Toast {...defaultProps} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Закрыть уведомление'));
    expect(onClose).toHaveBeenCalledWith('toast-1');
  });

  it('should have aria-label on close button', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByLabelText('Закрыть уведомление')).toBeDefined();
  });

  it('should apply green border for success type', () => {
    const { container } = render(<Toast {...defaultProps} type="success" />);
    const el = container.firstChild as HTMLElement;
    // jsdom converts hex #22c55e to rgb(34, 197, 94)
    expect(el.style.borderLeft).toContain('3px solid');
    expect(el.style.borderLeft).toContain('34, 197, 94');
  });

  it('should apply red border for error type', () => {
    const { container } = render(<Toast {...defaultProps} type="error" />);
    const el = container.firstChild as HTMLElement;
    // jsdom converts hex #ef4444 to rgb(239, 68, 68)
    expect(el.style.borderLeft).toContain('3px solid');
    expect(el.style.borderLeft).toContain('239, 68, 68');
  });

  it('should apply orange border for warning type', () => {
    const { container } = render(<Toast {...defaultProps} type="warning" />);
    const el = container.firstChild as HTMLElement;
    // jsdom converts hex #f59e0b to rgb(245, 158, 11)
    expect(el.style.borderLeft).toContain('3px solid');
    expect(el.style.borderLeft).toContain('245, 158, 11');
  });

  it('should apply indigo border for info type', () => {
    const { container } = render(<Toast {...defaultProps} type="info" />);
    const el = container.firstChild as HTMLElement;
    // jsdom converts hex #6366f1 to rgb(99, 102, 241)
    expect(el.style.borderLeft).toContain('3px solid');
    expect(el.style.borderLeft).toContain('99, 102, 241');
  });

  it('should apply slide-in animation', () => {
    const { container } = render(<Toast {...defaultProps} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.animation).toContain('toastSlideIn');
  });
});
