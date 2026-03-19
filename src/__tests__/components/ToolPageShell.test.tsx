import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ── Mock dependencies ─────────────────────────────────────────── */

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: (selector: (s: unknown) => unknown) =>
    selector({
      theme: {
        bg: '#06060b',
        surface: '#0c0c14',
        card: '#111119',
        cardHover: '#17171f',
        border: '#1e1e2e',
        text: '#e8e8f0',
        sub: '#7c7c96',
        dim: '#44445a',
        accent: '#ff2d55',
      },
    }),
}));

vi.mock('@/stores/useLocaleStore', () => ({
  useLocaleStore: Object.assign(
    (selector: (s: unknown) => unknown) =>
      selector({
        t: (key: string) => {
          const map: Record<string, string> = {
            'tools.comingSoon': 'Coming Soon',
            'tools.comingSoonDesc': 'This feature is under development',
            'tools.defaultDropLabel': 'Drop a file here',
            'tools.allFormatsSupported': 'All formats supported',
          };
          return map[key] ?? key;
        },
      }),
    {
      getState: () => ({
        t: (key: string) => key,
      }),
    },
  ),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolPageShell, ActionButton, ResultPreview } from '@/views/Tools/ToolPageShell';

describe('ToolPageShell', () => {
  const defaultProps = {
    title: 'YouTube Downloader',
    subtitle: 'Download videos from YouTube',
    gradient: ['#ff2d55', '#ec4899'] as [string, string],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the title', () => {
    render(
      <ToolPageShell {...defaultProps}>
        <div>Content</div>
      </ToolPageShell>,
    );
    expect(screen.getByText('YouTube Downloader')).toBeDefined();
  });

  it('renders the subtitle', () => {
    render(
      <ToolPageShell {...defaultProps}>
        <div>Content</div>
      </ToolPageShell>,
    );
    expect(screen.getByText('Download videos from YouTube')).toBeDefined();
  });

  it('renders child content', () => {
    render(
      <ToolPageShell {...defaultProps}>
        <div>Tool Content Here</div>
      </ToolPageShell>,
    );
    expect(screen.getByText('Tool Content Here')).toBeDefined();
  });

  it('renders a badge when provided', () => {
    render(
      <ToolPageShell {...defaultProps} badge="BETA">
        <div>Content</div>
      </ToolPageShell>,
    );
    expect(screen.getByText('BETA')).toBeDefined();
  });

  it('does not render badge when not provided', () => {
    render(
      <ToolPageShell {...defaultProps}>
        <div>Content</div>
      </ToolPageShell>,
    );
    expect(screen.queryByText('BETA')).toBeNull();
  });

  it('renders more content when comingSoon is true vs false', () => {
    const { container: withoutCS } = render(
      <ToolPageShell {...defaultProps} comingSoon={false}>
        <div>Content</div>
      </ToolPageShell>,
    );
    const withoutSVGs = withoutCS.querySelectorAll('svg').length;
    const withoutDivs = withoutCS.querySelectorAll('div').length;

    const { container: withCS } = render(
      <ToolPageShell {...defaultProps} comingSoon={true}>
        <div>Content</div>
      </ToolPageShell>,
    );
    const withSVGs = withCS.querySelectorAll('svg').length;
    const withDivs = withCS.querySelectorAll('div').length;

    // comingSoon adds a banner section with additional SVG and divs
    expect(withDivs).toBeGreaterThan(withoutDivs);
  });

  it('does not render coming soon banner by default', () => {
    render(
      <ToolPageShell {...defaultProps}>
        <div>Content</div>
      </ToolPageShell>,
    );
    expect(screen.queryByText('Coming Soon')).toBeNull();
  });

  it('has a back button that navigates to /tools', () => {
    const { container } = render(
      <ToolPageShell {...defaultProps}>
        <div>Content</div>
      </ToolPageShell>,
    );
    // The first button in the header is the back button
    const buttons = container.querySelectorAll('button');
    const backBtn = buttons[0];
    expect(backBtn).toBeDefined();
    fireEvent.click(backBtn!);
    expect(mockPush).toHaveBeenCalledWith('/tools');
  });

  it('renders the content area wrapper', () => {
    const { container } = render(
      <ToolPageShell {...defaultProps}>
        <div data-testid="inner">Content</div>
      </ToolPageShell>,
    );
    // The content wrapper has maxWidth 1400px
    const allDivs = Array.from(container.querySelectorAll('div'));
    const contentWrapper = allDivs.find(
      (el) => el.style.maxWidth === '1400px',
    );
    expect(contentWrapper).toBeDefined();
    // It should contain our child
    expect(contentWrapper!.textContent).toContain('Content');
  });
});

describe('ActionButton', () => {
  const defaultProps = {
    label: 'Process',
    gradient: ['#ff2d55', '#ec4899'] as [string, string],
    onClick: vi.fn(),
  };

  it('renders the button label', () => {
    render(<ActionButton {...defaultProps} />);
    expect(screen.getByText('Process')).toBeDefined();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ActionButton {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText('Process'));
    expect(onClick).toHaveBeenCalled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<ActionButton {...defaultProps} disabled />);
    const btn = screen.getByText('Process').closest('button');
    expect(btn?.disabled).toBe(true);
  });

  it('is disabled when loading prop is true', () => {
    render(<ActionButton {...defaultProps} loading />);
    const btn = screen.getByText('Process').closest('button');
    expect(btn?.disabled).toBe(true);
  });

  it('shows spinner SVG when loading', () => {
    const { container } = render(<ActionButton {...defaultProps} loading />);
    // When loading, a spinner SVG is rendered inside the button
    const svgs = container.querySelectorAll('button svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('does not show spinner SVG when not loading', () => {
    const { container } = render(<ActionButton {...defaultProps} />);
    const svgs = container.querySelectorAll('button svg');
    expect(svgs.length).toBe(0);
  });
});

describe('ResultPreview', () => {
  it('renders the label text', () => {
    const C = {
      bg: '#06060b', surface: '#0c0c14', card: '#111119', cardHover: '#17171f',
      border: '#1e1e2e', borderActive: '#2e2e44', accent: '#ff2d55', accentDim: 'rgba(255,45,85,.1)',
      blue: '#3a7bfd', green: '#2dd4a0', purple: '#8b5cf6', orange: '#f59e0b',
      cyan: '#06b6d4', pink: '#ec4899', red: '#ef4444', text: '#e8e8f0',
      sub: '#7c7c96', dim: '#44445a', overlay: 'rgba(0,0,0,.4)', overlayLight: 'rgba(0,0,0,.5)',
    };
    render(<ResultPreview C={C} label="Result will appear here" />);
    expect(screen.getByText('Result will appear here')).toBeDefined();
  });
});
