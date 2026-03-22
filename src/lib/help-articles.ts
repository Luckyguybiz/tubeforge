export interface HelpArticle {
  id: string;
  category: 'getting-started' | 'billing' | 'editor' | 'ai' | 'troubleshooting';
  title: string;
  content: string;
}

export const HELP_CATEGORIES: Record<HelpArticle['category'], { label: string; icon: string }> = {
  'getting-started': { label: 'Getting Started', icon: '🚀' },
  billing: { label: 'Billing & Subscription', icon: '💳' },
  editor: { label: 'Editor', icon: '🎬' },
  ai: { label: 'AI Generation', icon: '🤖' },
  troubleshooting: { label: 'Troubleshooting', icon: '🔧' },
};

export const HELP_ARTICLES: HelpArticle[] = [
  /* ── Getting Started ─────────────────────────────── */
  {
    id: 'create-first-project',
    category: 'getting-started',
    title: 'How to create your first project',
    content: `After signing up, go to the Dashboard page. Click the "New Project" button — the editor will open with a blank canvas.\n\nYou can choose a template or start from scratch. Your project is automatically saved as you work.`,
  },
  {
    id: 'how-editor-works',
    category: 'getting-started',
    title: 'How the editor works',
    content: `The TubeForge editor lets you create thumbnails, previews, and visual content for YouTube.\n\nOn the left is the scenes panel, in the center is the canvas with elements, and on the right are the properties of the selected element. You can add text, images, shapes, and AI generations.\n\nUse keyboard shortcuts (Ctrl+Z to undo, Ctrl+S to save) for faster workflow.`,
  },
  {
    id: 'export-video',
    category: 'getting-started',
    title: 'How to export a video',
    content: `Go to the "Preview" tab in the sidebar. Choose the export format (MP4, WebM) and quality.\n\nClick "Export" — the file will be processed and available for download. Processing time depends on duration and quality.`,
  },
  {
    id: 'analyze-videos',
    category: 'getting-started',
    title: 'How to analyze YouTube videos',
    content: `Go to the "Tools" section and select YouTube Video Analyzer. Paste the video URL and click "Analyze."\n\nYou will receive an SEO title score, engagement metrics, and optimization suggestions. You can watch the video right on the page through the embedded player.`,
  },

  /* ── Billing ─────────────────────────────────────── */
  {
    id: 'subscribe',
    category: 'billing',
    title: 'How to subscribe',
    content: `Go to the "Billing" page in the sidebar. Choose a plan: Free, Pro ($12/mo), or Studio ($30/mo).\n\nPayment is processed through Stripe — Visa and MasterCard are supported. After payment, plan features are activated instantly.`,
  },
  {
    id: 'cancel-subscription',
    category: 'billing',
    title: 'How to cancel your subscription',
    content: `Open "Billing" → "Manage Subscription." Click "Cancel Subscription."\n\nAfter cancellation, you'll retain access to paid features until the end of the current billing period. Your projects and data are not deleted.`,
  },
  {
    id: 'get-invoice',
    category: 'billing',
    title: 'How to get an invoice',
    content: `All invoices are automatically sent to your email with each payment. You can also find your payment history in "Billing" → "Payment History."\n\nFor invoices with company details, contact support: support@tubeforge.co.`,
  },
  {
    id: 'change-plan',
    category: 'billing',
    title: 'How to change your plan',
    content: `Go to "Billing" and select a new plan. When upgrading, the difference is prorated for the remaining period.\n\nWhen downgrading, changes take effect at the start of the next billing period.`,
  },

  /* ── Editor ──────────────────────────────────────── */
  {
    id: 'add-scene',
    category: 'editor',
    title: 'How to add a scene',
    content: `In the scenes panel (left side), click the "+" button to add a new scene. Each scene is a separate slide in your project.\n\nYou can rename a scene by double-clicking its name, and reorder scenes by dragging and dropping.`,
  },
  {
    id: 'use-ai-generation',
    category: 'editor',
    title: 'How to use AI generation',
    content: `In the editor, select the "AI Generation" tool from the toolbar. Enter a description of what you want to create and choose a model (Turbo, Standard, Pro, or Cinematic).\n\nPress Ctrl+Enter or click the "Generate" button. The result will appear on the canvas in a few seconds.`,
  },
  {
    id: 'keyboard-shortcuts',
    category: 'editor',
    title: 'Keyboard shortcuts',
    content: `Main keyboard shortcuts:\n\n• Ctrl+Z — undo\n• Ctrl+Shift+Z — redo\n• Ctrl+S — save\n• Ctrl+D — duplicate element\n• Ctrl+C / Ctrl+V — copy / paste\n• Delete — delete element\n• Ctrl+= / Ctrl+- — zoom\n• ? — show all shortcuts\n\nThe full list is available by pressing "?" in the editor.`,
  },

  /* ── AI ──────────────────────────────────────────── */
  {
    id: 'ai-generation-limits',
    category: 'ai',
    title: 'AI generation limits',
    content: `Limits depend on your plan:\n\n• Free — 5 generations per day\n• Pro — 100 generations per day\n• Studio — unlimited generation\n\nLimits reset every 24 hours. Each generation (text, image, video) counts as one unit.`,
  },
  {
    id: 'generate-thumbnails',
    category: 'ai',
    title: 'How to generate thumbnails',
    content: `Go to the "Thumbnails" section in the sidebar. Describe your thumbnail idea in text — AI will generate several variants.\n\nYou can edit the result in the built-in editor: add text, change colors, apply effects. The finished thumbnail can be downloaded in PNG or JPEG format.`,
  },
  {
    id: 'ai-providers',
    category: 'ai',
    title: 'Available AI providers',
    content: `TubeForge integrates 10+ AI providers:\n\n• OpenAI (GPT-4, DALL-E) — text and images\n• Anthropic (Claude) — text and analysis\n• Runway — video generation\n• Google (Veo) — video content\n\nYou can choose the provider in settings or during generation. Each provider is suited for different tasks.`,
  },

  {
    id: 'voice-generation',
    category: 'ai',
    title: 'How to use voice generation',
    content: `Go to the "Tools" section and select Voice Generator. Enter the text you want to narrate and choose a voice from the available options.\n\nMultiple languages and voice styles are supported. The result can be downloaded in MP3 format or used in your project. More voices and generations are available on Pro and Studio plans.`,
  },

  /* ── Troubleshooting ─────────────────────────────── */
  {
    id: 'video-not-exporting',
    category: 'troubleshooting',
    title: 'Video is not exporting',
    content: `If export hangs or shows an error:\n\n1. Check your internet connection stability\n2. Try reducing export quality\n3. Clear your browser cache (Ctrl+Shift+Delete)\n4. Try a different browser (Chrome recommended)\n\nIf the problem persists, contact us: support@tubeforge.co with a description of the error.`,
  },
  {
    id: 'cannot-login',
    category: 'troubleshooting',
    title: 'Cannot log into my account',
    content: `Check the following:\n\n1. Make sure you're entering the correct email\n2. Try resetting your password via "Forgot password?"\n3. If you signed up with Google — use the "Sign in with Google" button\n4. Disable VPN and try again\n5. Clear cookies for tubeforge.co\n\nIf nothing helps — email support@tubeforge.co.`,
  },
  {
    id: 'payment-error',
    category: 'troubleshooting',
    title: 'Payment error',
    content: `If payment doesn't go through:\n\n1. Make sure your card has sufficient funds\n2. Check if international payments are blocked by your bank\n3. Try a different card\n4. Make sure 3D Secure verification completed successfully\n\nStripe supports Visa and MasterCard. For issues, contact your bank or email us: support@tubeforge.co.`,
  },
  {
    id: 'slow-performance',
    category: 'troubleshooting',
    title: 'Platform is running slowly',
    content: `For optimal performance:\n\n1. Use a modern browser (latest versions of Chrome, Firefox, Edge)\n2. Close unused tabs — the editor requires resources\n3. Check your internet speed (10+ Mbps recommended)\n4. Disable heavy browser extensions\n\nIf the issue is with a specific feature — let us know through the feedback widget.`,
  },
];
