/**
 * N7 — UpgradePrompt component tests.
 *
 * Tests rendering of the UpgradePrompt component for different feature types.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

/* eslint-disable @typescript-eslint/no-explicit-any */

// Must mock stores and trpc before imports
vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: (selector: (s: any) => any) => selector({
    theme: {
      bg: '#0d0d1a',
      text: '#e4e4ed',
      sub: '#7c7c96',
      dim: '#4a4a64',
      border: '#23233a',
      accent: '#7c5cfc',
      pink: '#fc5c9c',
      surface: '#16162a',
      card: '#1a1a32',
    },
    isDark: true,
  }),
}));

vi.mock('@/stores/useLocaleStore', () => ({
  useLocaleStore: (selector: (s: any) => any) => selector({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'upgrade.limitReached': 'Limit reached for {feature}',
        'upgrade.upgradeDesc': 'Upgrade your plan to unlock more features.',
        'upgrade.contextProjects': 'You have reached the limit of {count} projects.',
        'upgrade.contextAi': 'You have reached your AI generation limit.',
        'upgrade.contextScenes': 'You have reached your scene limit.',
        'upgrade.upgradeToPro': 'Upgrade to PRO',
        'upgrade.loading': 'Loading...',
        'upgrade.checkoutError': 'Checkout error',
        'upgrade.compareTitle': 'Feature',
        'upgrade.compareFree': 'Free',
        'upgrade.comparePro': 'Pro',
        'upgrade.compareProjects': 'Projects',
        'upgrade.freeProjects': '3',
        'upgrade.proProjects': '25',
        'upgrade.compareAi': 'AI',
        'upgrade.freeAi': '5/mo',
        'upgrade.proAi': '100/mo',
        'upgrade.compareExport': 'Export',
        'upgrade.freeExport': '720p',
        'upgrade.proExport': '4K',
        'upgrade.compareWatermark': 'Watermark',
        'upgrade.freeWatermark': 'Yes',
        'upgrade.proWatermark': 'No',
      };
      return translations[key] ?? key;
    },
  }),
}));

const mockMutate = vi.fn();
vi.mock('@/lib/trpc', () => ({
  trpc: {
    billing: {
      createCheckout: {
        useMutation: () => ({
          mutate: mockMutate,
          isPending: false,
        }),
      },
    },
  },
}));

vi.mock('@/stores/useNotificationStore', () => ({
  toast: { error: vi.fn() },
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';

/* ── Tests ─────────────────────────────────────────────────── */

describe('UpgradePrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with feature name in the heading', () => {
    render(<UpgradePrompt feature="AI generation" />);
    expect(screen.getByText('Limit reached for AI generation')).toBeDefined();
  });

  it('renders context message for "projects" feature', () => {
    render(<UpgradePrompt feature="projects" />);
    expect(screen.getByText('You have reached the limit of 3 projects.')).toBeDefined();
  });

  it('renders custom project count in context message', () => {
    render(<UpgradePrompt feature="projects" projectCount={5} />);
    expect(screen.getByText('You have reached the limit of 5 projects.')).toBeDefined();
  });

  it('renders context message for "ai" feature', () => {
    render(<UpgradePrompt feature="ai" />);
    expect(screen.getByText('You have reached your AI generation limit.')).toBeDefined();
  });

  it('renders context message for "scenes" feature', () => {
    render(<UpgradePrompt feature="scenes" />);
    expect(screen.getByText('You have reached your scene limit.')).toBeDefined();
  });

  it('renders default description for unknown features', () => {
    render(<UpgradePrompt feature="unknown-feature" />);
    expect(screen.getByText('Upgrade your plan to unlock more features.')).toBeDefined();
  });

  it('renders upgrade button', () => {
    render(<UpgradePrompt feature="projects" />);
    expect(screen.getByText('Upgrade to PRO')).toBeDefined();
  });

  it('calls createCheckout with PRO plan on button click', () => {
    render(<UpgradePrompt feature="projects" />);
    fireEvent.click(screen.getByText('Upgrade to PRO'));
    expect(mockMutate).toHaveBeenCalledWith({ plan: 'PRO' });
  });

  it('renders comparison table with correct data', () => {
    render(<UpgradePrompt feature="projects" />);
    // Header
    expect(screen.getByText('Feature')).toBeDefined();
    expect(screen.getByText('Free')).toBeDefined();
    expect(screen.getByText('Pro')).toBeDefined();
    // Row data
    expect(screen.getByText('Projects')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
    expect(screen.getByText('25')).toBeDefined();
    expect(screen.getByText('AI')).toBeDefined();
    expect(screen.getByText('5/mo')).toBeDefined();
    expect(screen.getByText('100/mo')).toBeDefined();
  });

  it('renders lock icon', () => {
    const { container } = render(<UpgradePrompt feature="test" />);
    // The component uses &#x1F512; (lock emoji) character
    const lockText = container.textContent;
    expect(lockText).toContain('\uD83D\uDD12'); // lock emoji
  });
});
