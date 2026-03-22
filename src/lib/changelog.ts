export interface ChangelogEntry {
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'fix' | 'improvement';
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-03-20',
    title: 'AI Video Generation',
    description: 'Launched AI video generation: support for Runway Gen-3 and Google Veo 3. Create video clips from text descriptions right in the editor.',
    type: 'feature',
  },
  {
    date: '2026-03-18',
    title: 'Minecraft Styles in Tools',
    description: 'Added Minecraft-styled themes for tools. Fixed promo code functionality in analytics and ImportModal typing.',
    type: 'improvement',
  },
  {
    date: '2026-03-15',
    title: 'YouTube Video Analyzer',
    description: 'Launched YouTube Video Analyzer: SEO title scoring, engagement metrics, optimization suggestions. Embedded player.',
    type: 'improvement',
  },
  {
    date: '2026-03-12',
    title: 'SEO and Landing Page',
    description: 'Updated the home page: new design, blog with SEO articles, responsive layout, deployment documentation.',
    type: 'feature',
  },
  {
    date: '2026-03-10',
    title: 'Referral Program',
    description: 'Launched the referral system: invite friends and earn 20% of their payments. Integrated Sentry for error monitoring.',
    type: 'feature',
  },
  {
    date: '2026-03-07',
    title: 'VPN for YouTube',
    description: 'Built-in WireGuard VPN for YouTube access. Automatic config generation, speeds up to 1 Gbps.',
    type: 'feature',
  },
  {
    date: '2026-03-04',
    title: 'Billing Fixes',
    description: 'Fixed errors in Stripe webhook processing. Improved subscription status display and payment history.',
    type: 'fix',
  },
  {
    date: '2026-03-01',
    title: 'Onboarding Tour',
    description: 'Added an interactive tour for new users: step-by-step introduction to the editor, tools, and settings.',
    type: 'feature',
  },
  {
    date: '2026-02-25',
    title: 'Shorts and TikTok Analytics',
    description: 'New dashboards for YouTube Shorts and TikTok: views, CTR, retention time. Cross-platform metric comparison.',
    type: 'feature',
  },
  {
    date: '2026-02-20',
    title: 'Editor Improvements',
    description: 'Added stickers, improved canvas scaling, fixed undo/redo behavior with multiple changes.',
    type: 'improvement',
  },
];
