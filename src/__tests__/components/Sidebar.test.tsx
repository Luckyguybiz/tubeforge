import { describe, it, expect, vi, beforeEach } from 'vitest';

/* ── Mock external dependencies ────────────────────────────────── */

const mockPush = vi.fn();
const mockSignOut = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: {
      user: { name: 'Test User', email: 'test@example.com', plan: 'FREE', role: 'USER' },
    },
  }),
  signOut: (...args: unknown[]) => mockSignOut(...args),
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
        borderActive: '#2e2e44',
        accent: '#ff2d55',
        accentDim: 'rgba(255,45,85,.1)',
        blue: '#3a7bfd',
        green: '#2dd4a0',
        purple: '#8b5cf6',
        orange: '#f59e0b',
        cyan: '#06b6d4',
        pink: '#ec4899',
        red: '#ef4444',
        text: '#e8e8f0',
        sub: '#7c7c96',
        dim: '#44445a',
        overlay: 'rgba(0,0,0,.4)',
        overlayLight: 'rgba(0,0,0,.5)',
      },
      isDark: true,
    }),
}));

vi.mock('@/stores/useLocaleStore', () => ({
  useLocaleStore: (selector: (s: unknown) => unknown) =>
    selector({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'nav.dashboard': 'Dashboard',
          'nav.editor': 'Editor',
          'nav.metadata': 'Metadata',
          'nav.thumbnails': 'Thumbnails',
          'nav.preview': 'Preview',
          'nav.team': 'Team',
          'nav.settings': 'Settings',
          'nav.admin': 'Admin',
          'nav.billing': 'Billing',
          'nav.tools': 'All Tools',
          'nav.referral': 'Referral',
          'nav.shortsAnalytics': 'Shorts Analytics',
          'sidebar.creation': 'Creation',
          'sidebar.tools': 'Tools',
          'sidebar.team': 'Team',
          'sidebar.system': 'System',
          'sidebar.collapse': 'Collapse',
          'sidebar.collapseLabel': 'Collapse sidebar',
          'sidebar.expand': 'Expand',
          'sidebar.expandLabel': 'Expand sidebar',
          'sidebar.search': 'Search...',
          'sidebar.searchLabel': 'Open search',
          'sidebar.upgrade': 'Upgrade',
          'sidebar.upgradeDesc': 'Unlock more features',
          'sidebar.upgradeCta': 'Upgrade Now',
          'sidebar.logout': 'Logout',
          'sidebar.logoutLabel': 'Sign out',
          'sidebar.settingsLabel': 'Settings',
          'common.user': 'User',
          'common.free': 'Free',
          'common.pro': 'Pro',
          'common.studio': 'Studio',
        };
        return translations[key] ?? key;
      },
    }),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from '@/components/layout/Sidebar';

describe('Sidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear localStorage to reset collapse state
    localStorage.clear();
  });

  it('renders the main navigation landmark', () => {
    render(<Sidebar />);
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeDefined();
  });

  it('renders the TubeForge brand text', () => {
    render(<Sidebar />);
    expect(screen.getByText('TubeForge')).toBeDefined();
  });

  it('renders Creator Studio subtitle', () => {
    render(<Sidebar />);
    expect(screen.getByText('Creator Studio')).toBeDefined();
  });

  it('renders navigation items for creation section', () => {
    render(<Sidebar />);
    expect(screen.getByText('Dashboard')).toBeDefined();
    expect(screen.getByText('Editor')).toBeDefined();
    expect(screen.getByText('Metadata')).toBeDefined();
  });

  it('renders tools section items', () => {
    render(<Sidebar />);
    expect(screen.getByText('All Tools')).toBeDefined();
    expect(screen.getByText('Thumbnails')).toBeDefined();
    expect(screen.getByText('Preview')).toBeDefined();
  });

  it('renders system section items', () => {
    render(<Sidebar />);
    expect(screen.getByText('Referral')).toBeDefined();
    expect(screen.getByText('Settings')).toBeDefined();
    expect(screen.getByText('Billing')).toBeDefined();
  });

  it('does not render Admin link for non-admin users', () => {
    render(<Sidebar />);
    expect(screen.queryByText('Admin')).toBeNull();
  });

  it('renders the user name', () => {
    render(<Sidebar />);
    expect(screen.getByText('Test User')).toBeDefined();
  });

  it('renders the user initials as avatar', () => {
    render(<Sidebar />);
    expect(screen.getByText('TU')).toBeDefined();
  });

  it('renders the plan badge', () => {
    render(<Sidebar />);
    expect(screen.getByText('Free')).toBeDefined();
  });

  it('renders upgrade prompt for FREE users', () => {
    render(<Sidebar />);
    expect(screen.getByText('Upgrade')).toBeDefined();
    expect(screen.getByText('Upgrade Now')).toBeDefined();
  });

  it('marks the current page as active with aria-current', () => {
    render(<Sidebar />);
    const dashboardBtn = screen.getByText('Dashboard').closest('button');
    expect(dashboardBtn?.getAttribute('aria-current')).toBe('page');
  });

  it('navigates when a nav button is clicked', () => {
    render(<Sidebar />);
    const editorBtn = screen.getByText('Editor').closest('button');
    if (editorBtn) fireEvent.click(editorBtn);
    expect(mockPush).toHaveBeenCalledWith('/editor');
  });

  it('renders section labels', () => {
    render(<Sidebar />);
    expect(screen.getByText('Creation')).toBeDefined();
    expect(screen.getByText('Tools')).toBeDefined();
    expect(screen.getByText('System')).toBeDefined();
  });

  it('has a collapse button', () => {
    render(<Sidebar />);
    const collapseBtn = screen.getByLabelText('Collapse sidebar');
    expect(collapseBtn).toBeDefined();
  });

  it('renders the search trigger', () => {
    render(<Sidebar />);
    expect(screen.getByLabelText('Open search')).toBeDefined();
  });

  it('renders the logout button', () => {
    render(<Sidebar />);
    const logoutBtn = screen.getByLabelText('Sign out');
    expect(logoutBtn).toBeDefined();
  });

  it('calls signOut when logout is clicked', () => {
    render(<Sidebar />);
    const logoutBtn = screen.getByLabelText('Sign out');
    fireEvent.click(logoutBtn);
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('navigates to billing when upgrade CTA is clicked', () => {
    render(<Sidebar />);
    const upgradeBtn = screen.getByText('Upgrade Now');
    fireEvent.click(upgradeBtn);
    expect(mockPush).toHaveBeenCalledWith('/billing');
  });

  it('renders the TF logo mark', () => {
    render(<Sidebar />);
    expect(screen.getByText('TF')).toBeDefined();
  });

  it('renders the TubeForge brand name and logo', () => {
    render(<Sidebar />);
    // Both the brand name and the logo mark should be visible
    expect(screen.getByText('TubeForge')).toBeDefined();
    expect(screen.getByText('TF')).toBeDefined();
    expect(screen.getByText('Creator Studio')).toBeDefined();
  });
});
