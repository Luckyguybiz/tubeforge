import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ── Mock dependencies ─────────────────────────────────────────── */

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('@/stores/useThemeStore', () => ({
  useThemeStore: (selector: (s: unknown) => unknown) =>
    selector({
      theme: {
        bg: '#0a0a0a',
        surface: '#141414',
        card: '#1a1a1a',
        cardHover: '#222222',
        border: 'rgba(255,255,255,0.08)',
        borderActive: 'rgba(255,255,255,0.15)',
        text: '#ffffff',
        sub: 'rgba(255,255,255,0.5)',
        dim: 'rgba(255,255,255,0.2)',
        accent: '#6366f1',
        green: '#10b981',
        blue: '#3b82f6',
        orange: '#f59e0b',
        overlay: 'rgba(0,0,0,0.6)',
      },
      isDark: true,
      mode: 'dark',
      toggle: vi.fn(),
    }),
}));

vi.mock('@/stores/useLocaleStore', () => ({
  useLocaleStore: (selector: (s: unknown) => unknown) =>
    selector({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'nav.dashboard': 'My Works',
          'nav.editor': 'Editor',
          'nav.settings': 'Settings',
          'nav.admin': 'Admin',
          'nav.team': 'Team',
          'nav.referral': 'Referral',
          'common.back': 'Back',
          'settings.dark': 'Dark',
          'settings.light': 'Light',
          'settings.system': 'System',
          'settings.themeTitle': 'Theme',
          'topbar.referralCta': 'Earn Money',
        };
        return translations[key] ?? key;
      },
    }),
}));

vi.mock('@/stores/useMobileMenuStore', () => ({
  useMobileMenuStore: (selector: (s: unknown) => unknown) =>
    selector({
      toggle: vi.fn(),
    }),
}));

vi.mock('@/lib/constants', () => ({
  NAV: [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'editor', label: 'Editor' },
  ],
  KEYBOARD_SHORTCUTS: [],
  SHORTCUT_CATEGORIES: [],
  Z_INDEX: { DROPDOWN: 100, MODAL: 200 },
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TopBar } from '@/components/layout/TopBar';

describe('TopBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the breadcrumb navigation', () => {
    render(<TopBar />);
    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumb).toBeDefined();
  });

  it('renders the TF logo badge in breadcrumbs', () => {
    render(<TopBar />);
    expect(screen.getByText('TF')).toBeDefined();
  });

  it('renders the referral CTA button', () => {
    render(<TopBar />);
    expect(screen.getByText(/Earn Money/)).toBeDefined();
  });

  it('navigates to referral when CTA is clicked', () => {
    render(<TopBar />);
    const referralBtn = screen.getByText(/Earn Money/);
    fireEvent.click(referralBtn);
    expect(mockPush).toHaveBeenCalledWith('/referral');
  });

  it('renders the theme toggle button', () => {
    render(<TopBar />);
    const themeBtn = screen.getByLabelText(/Theme: Dark/i);
    expect(themeBtn).toBeDefined();
  });

  it('renders the TopBar container with correct height', () => {
    const { container } = render(<TopBar />);
    const topBarDiv = container.firstChild as HTMLElement;
    expect(topBarDiv.style.height).toBe('56px');
  });

  it('renders the hamburger menu button', () => {
    render(<TopBar />);
    const hamburger = screen.getByLabelText('Menu');
    expect(hamburger).toBeDefined();
  });
});
