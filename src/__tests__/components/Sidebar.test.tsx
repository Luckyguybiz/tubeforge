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
        bg: '#0a0a0a',
        surface: '#141414',
        card: '#1a1a1a',
        cardHover: '#222222',
        border: 'rgba(255,255,255,0.08)',
        borderActive: 'rgba(255,255,255,0.16)',
        accent: '#6366f1',
        accentDim: 'rgba(99,102,241,0.1)',
        blue: '#3b82f6',
        green: '#10b981',
        purple: '#8b5cf6',
        orange: '#f59e0b',
        cyan: '#06b6d4',
        pink: '#ec4899',
        red: '#ef4444',
        text: '#ffffff',
        sub: 'rgba(255,255,255,0.5)',
        dim: 'rgba(255,255,255,0.2)',
        overlay: 'rgba(0,0,0,0.6)',
        overlayLight: 'rgba(0,0,0,0.8)',
      },
      isDark: true,
    }),
}));

vi.mock('@/stores/useLocaleStore', () => ({
  useLocaleStore: (selector: (s: unknown) => unknown) =>
    selector({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'nav.dashboard': 'My Works',
          'nav.editor': 'Editor',
          'nav.metadata': 'Metadata',
          'nav.seoOptimizer': 'SEO Optimizer',
          'nav.thumbnails': 'Thumbnails',
          'nav.preview': 'Preview',
          'nav.publish': 'Publish & Plan',
          'nav.designStudio': 'Design Studio',
          'nav.team': 'Team',
          'nav.settings': 'Settings',
          'nav.admin': 'Admin',
          'nav.billing': 'Billing',
          'nav.tools': 'All Tools',
          'nav.keywords': 'Keywords',
          'nav.referral': 'Referral',
          'nav.shortsAnalytics': 'Shorts Analytics',
          'nav.tiktokAnalytics': 'TikTok Analytics',
          'nav.analytics': 'Analytics',
          'nav.aiThumbnails': 'AI Thumbnails',
          'nav.media': 'Media',
          'nav.brand': 'Brand',
          'nav.blog': 'Blog',
          'sidebar.creation': 'Creation',
          'sidebar.create': 'Create',
          'sidebar.tools': 'Tools',
          'sidebar.team': 'Team',
          'sidebar.system': 'System',
          'sidebar.account': 'Account',
          'sidebar.collapse': 'Collapse',
          'sidebar.collapseLabel': 'Collapse sidebar',
          'sidebar.expand': 'Expand',
          'sidebar.expandLabel': 'Expand sidebar',
          'sidebar.search': 'Search...',
          'sidebar.searchLabel': 'Open search',
          'sidebar.upgrade': 'Upgrade',
          'sidebar.upgradeDesc': 'Unlock more features',
          'sidebar.upgradeCta': 'Upgrade Now',
          'sidebar.upgradePlan': 'Upgrade Plan',
          'sidebar.usageProjects': 'Projects',
          'sidebar.usageAi': 'AI Usage',
          'sidebar.logout': 'Logout',
          'sidebar.logoutLabel': 'Sign out',
          'sidebar.settingsLabel': 'Settings',
          'sidebar.manageAccount': 'Manage Account',
          'sidebar.viewProfile': 'View Profile',
          'sidebar.upgradeToPro': 'Upgrade to Pro',
          'sidebar.creditsRemaining': 'credits remaining',
          'sidebar.signOut': 'Sign Out',
          'common.user': 'User',
          'common.free': 'Free',
          'common.pro': 'Pro',
          'common.studio': 'Studio',
        };
        return translations[key] ?? key;
      },
    }),
}));

// Mock tRPC — needed by usePlanLimits hook used by SidebarUsageWidget
vi.mock('@/lib/trpc', () => ({
  trpc: {
    user: {
      getProfile: {
        useQuery: () => ({
          data: {
            plan: 'FREE',
            onboardingDone: true,
            _count: { projects: 1 },
            aiUsage: 2,
          },
          isLoading: false,
          isError: false,
          error: null,
          refetch: vi.fn(),
        }),
      },
    },
  },
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

  it('renders navigation items for create section', () => {
    render(<Sidebar />);
    expect(screen.getByText('AI Thumbnails')).toBeDefined();
    expect(screen.getByText('My Works')).toBeDefined();
    expect(screen.getByText('Editor')).toBeDefined();
    expect(screen.getByText('Publish & Plan')).toBeDefined();
  });

  it('renders tools section items', () => {
    render(<Sidebar />);
    expect(screen.getByText('All Tools')).toBeDefined();
    expect(screen.getByText('Design Studio')).toBeDefined();
    expect(screen.getByText('Keywords')).toBeDefined();
    expect(screen.getByText('Analytics')).toBeDefined();
  });

  it('renders account section items', () => {
    render(<Sidebar />);
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
    // Plan badge appears in both the user panel and the usage widget
    const badges = screen.getAllByText('Free');
    expect(badges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders upgrade button for FREE users in usage widget', () => {
    render(<Sidebar />);
    expect(screen.getByText('Upgrade Plan')).toBeDefined();
  });

  it('marks the current page as active with aria-current', () => {
    render(<Sidebar />);
    const dashboardBtn = screen.getByText('My Works').closest('button');
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
    expect(screen.getByText('Create')).toBeDefined();
    expect(screen.getByText('Tools')).toBeDefined();
    expect(screen.getByText('Account')).toBeDefined();
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

  it('opens profile dropdown and shows sign out', () => {
    render(<Sidebar />);
    // Click user panel to open dropdown
    const userName = screen.getByText('Test User');
    fireEvent.click(userName.closest('div[style]')!);
    expect(screen.getByText('Sign Out')).toBeDefined();
  });

  it('calls signOut when sign out is clicked in dropdown', () => {
    render(<Sidebar />);
    // Click user panel to open dropdown
    const userName = screen.getByText('Test User');
    fireEvent.click(userName.closest('div[style]')!);
    const signOutBtn = screen.getByText('Sign Out');
    fireEvent.click(signOutBtn);
    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
  });

  it('navigates to billing when upgrade CTA is clicked', () => {
    render(<Sidebar />);
    const upgradeBtn = screen.getByText('Upgrade Plan');
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
