/**
 * Tests for ErrorBoundary component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock useThemeStore before any imports that use it
vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: () => ({
    theme: {
      bg: '#0d0d1a',
      text: '#e4e4ed',
      sub: '#7c7c96',
      dim: '#4a4a64',
      border: '#23233a',
      accent: '#7c5cfc',
      surface: '#16162a',
      card: '#1a1a32',
    },
  }),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Component that throws
function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Test error');
  return <div>Normal content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    // Suppress React error boundary console.error logs
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Hello</div>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Hello')).toBeDefined();
  });

  it('should catch errors and show default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Не удалось отобразить компонент')).toBeDefined();
  });

  it('should show custom fallback when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error UI</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom error UI')).toBeDefined();
  });

  it('should show retry button in default fallback', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Повторить')).toBeDefined();
  });

  it('should log error to console', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );
    const boundaryLogCall = consoleError.mock.calls.find(
      (call) => typeof call[0] === 'string' && call[0].includes('[ErrorBoundary]'),
    );
    expect(boundaryLogCall).toBeDefined();
  });

  it('should recover when retry button is clicked', () => {
    // Use a variable to control throwing
    let shouldThrow = true;
    function ConditionalThrow() {
      if (shouldThrow) throw new Error('Test');
      return <div>Recovered!</div>;
    }

    const { rerender } = render(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Не удалось отобразить компонент')).toBeDefined();

    // Stop throwing and click retry
    shouldThrow = false;
    fireEvent.click(screen.getByText('Повторить'));

    // After reset, children should re-render
    rerender(
      <ErrorBoundary>
        <ConditionalThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Recovered!')).toBeDefined();
  });
});
