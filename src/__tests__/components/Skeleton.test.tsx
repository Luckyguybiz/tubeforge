/**
 * Tests for Skeleton loading component
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: (selector: (s: unknown) => unknown) =>
    selector({
      theme: {
        surface: '#16162a',
        card: '#1a1a32',
      },
    }),
}));

import React from 'react';
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/ui/Skeleton';

describe('Skeleton', () => {
  it('should render with default dimensions', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('100%');
    expect(el.style.height).toBe('20px');
  });

  it('should accept custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="40px" />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('200px');
    expect(el.style.height).toBe('40px');
  });

  it('should accept numeric dimensions', () => {
    const { container } = render(<Skeleton width={150} height={30} />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.width).toBe('150px');
    expect(el.style.height).toBe('30px');
  });

  it('should apply rounded border radius when rounded prop is true', () => {
    const { container } = render(<Skeleton rounded />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.borderRadius).toBe('12px');
  });

  it('should apply standard border radius when rounded is false', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.borderRadius).toBe('8px');
  });

  it('should be hidden from accessibility tree', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.getAttribute('aria-hidden')).toBe('true');
    expect(el.getAttribute('role')).toBe('presentation');
  });

  it('should apply shimmer animation', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.animation).toContain('shimmer');
  });

  it('should merge extra styles', () => {
    const { container } = render(
      <Skeleton style={{ marginTop: 10, opacity: 0.5 }} />,
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.marginTop).toBe('10px');
    expect(el.style.opacity).toBe('0.5');
  });

  it('should use theme colors for background', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el.style.backgroundColor).toBe('rgb(22, 22, 42)'); // #16162a
  });
});
