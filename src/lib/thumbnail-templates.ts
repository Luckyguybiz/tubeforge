// Pre-made YouTube thumbnail template library
// Each template provides 2-5 pre-configured CanvasElement objects positioned for 1280x720

import type { CanvasElement } from './types';

export type TemplateCategory = 'gaming' | 'vlog' | 'tutorial' | 'review' | 'news' | 'minimal' | 'bold';

export interface ThumbnailTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  preview: { bg: string; elements: string[] };
  canvasBg: string;
  elements: Omit<CanvasElement, 'id'>[];
}

export const TEMPLATE_CATEGORIES: { id: TemplateCategory; label: string; icon: string }[] = [
  { id: 'gaming', label: 'Gaming', icon: 'G' },
  { id: 'vlog', label: 'Vlog', icon: 'V' },
  { id: 'tutorial', label: 'Tutorial', icon: 'T' },
  { id: 'review', label: 'Review', icon: 'R' },
  { id: 'news', label: 'News', icon: 'N' },
  { id: 'minimal', label: 'Minimal', icon: 'M' },
  { id: 'bold', label: 'Bold', icon: 'B' },
];

export const THUMBNAIL_TEMPLATES: ThumbnailTemplate[] = [
  // ===== GAMING (3) =====
  {
    id: 'gaming-epic-battle',
    name: 'Epic Battle',
    category: 'gaming',
    preview: { bg: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)', elements: ['EPIC', 'BATTLE', 'neon glow'] },
    canvasBg: '#0f0c29',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 720, color: '#0f0c29', opacity: 1, rot: 0 },
      { type: 'rect', x: 0, y: 520, w: 1280, h: 200, color: '#6d28d9', opacity: 0.3, borderR: 0, rot: 0 },
      { type: 'text', x: 80, y: 180, w: 1120, h: 140, text: 'EPIC BATTLE', font: 'Impact', size: 120, bold: true, italic: false, color: '#ffffff', shadow: '0 0 40px rgba(139,92,246,.8)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', glow: { color: '#8b5cf6', blur: 20, spread: 0 } },
      { type: 'text', x: 280, y: 380, w: 720, h: 60, text: 'YOU WON\'T BELIEVE THIS', font: 'Impact', size: 42, bold: true, italic: false, color: '#c4b5fd', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', letterSpacing: 4 },
      { type: 'rect', x: 440, y: 480, w: 400, h: 6, color: '#8b5cf6', opacity: 0.6, borderR: 3, rot: 0 },
    ],
  },
  {
    id: 'gaming-gameplay-react',
    name: 'Gameplay React',
    category: 'gaming',
    preview: { bg: 'linear-gradient(135deg, #1a1a2e, #16213e)', elements: ['split', 'facecam', 'gameplay'] },
    canvasBg: '#1a1a2e',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 820, h: 720, color: '#16213e', opacity: 0.5, borderR: 0, rot: 0 },
      { type: 'rect', x: 840, y: 0, w: 440, h: 720, color: '#0f3460', opacity: 0.4, borderR: 0, rot: 0 },
      { type: 'circle', x: 920, y: 120, w: 280, h: 280, color: '#e94560', opacity: 0.15, rot: 0 },
      { type: 'text', x: 40, y: 460, w: 780, h: 100, text: 'MY REACTION', font: 'Impact', size: 80, bold: true, italic: false, color: '#ffffff', shadow: '0 4px 20px rgba(0,0,0,.8)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'text', x: 40, y: 580, w: 780, h: 50, text: 'LIVE GAMEPLAY', font: 'Arial', size: 32, bold: true, italic: false, color: '#e94560', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', letterSpacing: 6 },
    ],
  },
  {
    id: 'gaming-top-10',
    name: 'Top 10 Gaming',
    category: 'gaming',
    preview: { bg: 'linear-gradient(180deg, #ff416c, #ff4b2b)', elements: ['TOP 10', 'numbered', 'gradient'] },
    canvasBg: '#1a0a0a',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 720, color: '#ff416c', opacity: 0.15, borderR: 0, rot: 0 },
      { type: 'text', x: 60, y: 60, w: 400, h: 200, text: 'TOP', font: 'Impact', size: 160, bold: true, italic: false, color: '#ff416c', shadow: '0 4px 20px rgba(255,65,108,.4)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'text', x: 460, y: 60, w: 300, h: 200, text: '10', font: 'Impact', size: 180, bold: true, italic: false, color: '#ffffff', shadow: '0 4px 20px rgba(0,0,0,.6)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'rect', x: 60, y: 300, w: 600, h: 6, color: '#ff416c', opacity: 0.8, borderR: 3, rot: 0 },
      { type: 'text', x: 60, y: 340, w: 800, h: 80, text: 'BEST GAMES OF 2026', font: 'Arial', size: 48, bold: true, italic: false, color: '#ffffff', shadow: 'none', opacity: 0.8, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', letterSpacing: 2 },
    ],
  },

  // ===== VLOG (3) =====
  {
    id: 'vlog-day-in-my-life',
    name: 'Day in My Life',
    category: 'vlog',
    preview: { bg: 'linear-gradient(135deg, #fceabb, #f8b500)', elements: ['warm', 'handwriting', 'frame'] },
    canvasBg: '#fdf6e3',
    elements: [
      { type: 'rect', x: 40, y: 40, w: 1200, h: 640, color: '#f8b500', opacity: 0.12, borderR: 20, rot: 0 },
      { type: 'text', x: 80, y: 120, w: 1120, h: 120, text: 'a day in my life', font: 'Georgia', size: 80, bold: false, italic: true, color: '#2d2d2d', shadow: 'none', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'rect', x: 540, y: 280, w: 200, h: 4, color: '#f8b500', opacity: 0.6, borderR: 2, rot: 0 },
      { type: 'text', x: 280, y: 320, w: 720, h: 60, text: 'MORNING ROUTINE + GROCERY HAUL', font: 'Arial', size: 28, bold: true, italic: false, color: '#6b5b3e', shadow: 'none', opacity: 0.7, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', letterSpacing: 3 },
      { type: 'rect', x: 60, y: 60, w: 1160, h: 600, color: 'transparent', opacity: 1, borderR: 16, rot: 0, border: '2px solid rgba(248,181,0,0.3)' },
    ],
  },
  {
    id: 'vlog-travel',
    name: 'Travel Vlog',
    category: 'vlog',
    preview: { bg: 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)', elements: ['scenic', 'elegant', 'text'] },
    canvasBg: '#0f2027',
    elements: [
      { type: 'rect', x: 0, y: 480, w: 1280, h: 240, color: '#000000', opacity: 0.5, borderR: 0, rot: 0 },
      { type: 'text', x: 60, y: 500, w: 1160, h: 90, text: 'EXPLORING TOKYO', font: 'Georgia', size: 72, bold: true, italic: false, color: '#ffffff', shadow: '0 2px 16px rgba(0,0,0,.6)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'text', x: 60, y: 610, w: 700, h: 40, text: 'Hidden gems & local food', font: 'Georgia', size: 28, bold: false, italic: true, color: '#94a3b8', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'rect', x: 60, y: 590, w: 120, h: 3, color: '#06b6d4', opacity: 0.8, borderR: 2, rot: 0 },
    ],
  },
  {
    id: 'vlog-challenge',
    name: 'Challenge Video',
    category: 'vlog',
    preview: { bg: 'linear-gradient(135deg, #ff9a9e, #fad0c4)', elements: ['VS', 'bold', 'split'] },
    canvasBg: '#1a1a1a',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 600, h: 720, color: '#3b82f6', opacity: 0.15, borderR: 0, rot: 0 },
      { type: 'rect', x: 680, y: 0, w: 600, h: 720, color: '#ef4444', opacity: 0.15, borderR: 0, rot: 0 },
      { type: 'circle', x: 540, y: 260, w: 200, h: 200, color: '#fbbf24', opacity: 1, rot: 0 },
      { type: 'text', x: 560, y: 290, w: 160, h: 140, text: 'VS', font: 'Impact', size: 90, bold: true, italic: false, color: '#1a1a1a', shadow: 'none', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'text', x: 80, y: 560, w: 1120, h: 80, text: 'THE ULTIMATE CHALLENGE', font: 'Impact', size: 64, bold: true, italic: false, color: '#ffffff', shadow: '0 4px 20px rgba(0,0,0,.8)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
    ],
  },

  // ===== TUTORIAL (3) =====
  {
    id: 'tutorial-step-by-step',
    name: 'Step by Step',
    category: 'tutorial',
    preview: { bg: 'linear-gradient(135deg, #667eea, #764ba2)', elements: ['steps', 'clean', 'numbered'] },
    canvasBg: '#0f172a',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 720, color: '#6366f1', opacity: 0.08, borderR: 0, rot: 0 },
      { type: 'text', x: 60, y: 60, w: 1160, h: 100, text: 'HOW TO EDIT VIDEOS', font: 'Arial', size: 72, bold: true, italic: false, color: '#ffffff', shadow: 'none', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'text', x: 60, y: 180, w: 600, h: 40, text: 'COMPLETE BEGINNER GUIDE', font: 'Arial', size: 24, bold: true, italic: false, color: '#818cf8', shadow: 'none', opacity: 0.8, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', letterSpacing: 4 },
      { type: 'rect', x: 60, y: 280, w: 360, h: 360, color: '#6366f1', opacity: 0.12, borderR: 16, rot: 0 },
      { type: 'text', x: 460, y: 300, w: 760, h: 300, text: '1. Import\n2. Cut & Trim\n3. Effects\n4. Export', font: 'Arial', size: 36, bold: true, italic: false, color: '#e2e8f0', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', lineHeight: 2.0 },
    ],
  },
  {
    id: 'tutorial-before-after',
    name: 'Before / After',
    category: 'tutorial',
    preview: { bg: 'linear-gradient(90deg, #434343, #000000)', elements: ['split', 'arrow', 'before/after'] },
    canvasBg: '#111111',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 620, h: 720, color: '#1e293b', opacity: 0.5, borderR: 0, rot: 0 },
      { type: 'rect', x: 660, y: 0, w: 620, h: 720, color: '#0f766e', opacity: 0.15, borderR: 0, rot: 0 },
      { type: 'text', x: 100, y: 580, w: 420, h: 60, text: 'BEFORE', font: 'Impact', size: 52, bold: true, italic: false, color: '#94a3b8', shadow: 'none', opacity: 0.8, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'text', x: 760, y: 580, w: 420, h: 60, text: 'AFTER', font: 'Impact', size: 52, bold: true, italic: false, color: '#2dd4bf', shadow: 'none', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'text', x: 590, y: 320, w: 100, h: 80, text: '>>>', font: 'Impact', size: 48, bold: true, italic: false, color: '#fbbf24', shadow: 'none', opacity: 0.8, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
    ],
  },
  {
    id: 'tutorial-quick-tips',
    name: 'Quick Tips',
    category: 'tutorial',
    preview: { bg: 'linear-gradient(135deg, #11998e, #38ef7d)', elements: ['tips', 'checkmarks', 'list'] },
    canvasBg: '#052e16',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 720, color: '#10b981', opacity: 0.06, borderR: 0, rot: 0 },
      { type: 'text', x: 60, y: 50, w: 800, h: 100, text: '5 QUICK TIPS', font: 'Impact', size: 80, bold: true, italic: false, color: '#34d399', shadow: 'none', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'text', x: 60, y: 170, w: 600, h: 40, text: 'THAT ACTUALLY WORK', font: 'Arial', size: 28, bold: true, italic: false, color: '#6ee7b7', shadow: 'none', opacity: 0.6, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', letterSpacing: 3 },
      { type: 'rect', x: 60, y: 240, w: 700, h: 4, color: '#10b981', opacity: 0.4, borderR: 2, rot: 0 },
      { type: 'text', x: 60, y: 280, w: 800, h: 380, text: '  Tip #1 - Start early\n  Tip #2 - Be consistent\n  Tip #3 - Use templates\n  Tip #4 - Engage viewers\n  Tip #5 - Analyze data', font: 'Arial', size: 30, bold: false, italic: false, color: '#d1fae5', shadow: 'none', opacity: 0.85, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', lineHeight: 2.2 },
    ],
  },

  // ===== REVIEW (3) =====
  {
    id: 'review-product',
    name: 'Product Review',
    category: 'review',
    preview: { bg: 'linear-gradient(135deg, #141e30, #243b55)', elements: ['spotlight', 'product', 'stars'] },
    canvasBg: '#0f172a',
    elements: [
      { type: 'circle', x: 440, y: 80, w: 400, h: 400, color: '#3b82f6', opacity: 0.08, rot: 0 },
      { type: 'text', x: 60, y: 480, w: 1160, h: 80, text: 'FULL REVIEW', font: 'Impact', size: 72, bold: true, italic: false, color: '#ffffff', shadow: '0 2px 12px rgba(0,0,0,.6)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'text', x: 360, y: 580, w: 560, h: 50, text: 'Is it worth the hype?', font: 'Georgia', size: 28, bold: false, italic: true, color: '#94a3b8', shadow: 'none', opacity: 0.8, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'rect', x: 480, y: 650, w: 320, h: 40, color: '#fbbf24', opacity: 0.2, borderR: 20, rot: 0 },
      { type: 'text', x: 480, y: 650, w: 320, h: 40, text: 'HONEST OPINION', font: 'Arial', size: 18, bold: true, italic: false, color: '#fbbf24', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', letterSpacing: 3 },
    ],
  },
  {
    id: 'review-honest',
    name: 'Honest Review',
    category: 'review',
    preview: { bg: 'linear-gradient(135deg, #360033, #0b8793)', elements: ['dramatic', 'score', 'badge'] },
    canvasBg: '#1a0a2e',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 720, color: '#7c3aed', opacity: 0.08, borderR: 0, rot: 0 },
      { type: 'text', x: 60, y: 120, w: 900, h: 120, text: 'HONEST REVIEW', font: 'Impact', size: 96, bold: true, italic: false, color: '#ffffff', shadow: '0 4px 20px rgba(0,0,0,.8)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'circle', x: 1000, y: 100, w: 200, h: 200, color: '#ef4444', opacity: 0.9, rot: 0 },
      { type: 'text', x: 1000, y: 140, w: 200, h: 120, text: '9.5', font: 'Impact', size: 80, bold: true, italic: false, color: '#ffffff', shadow: 'none', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'text', x: 60, y: 280, w: 800, h: 50, text: 'NO SPONSORSHIP - REAL OPINION', font: 'Arial', size: 24, bold: true, italic: false, color: '#c4b5fd', shadow: 'none', opacity: 0.6, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', letterSpacing: 4 },
    ],
  },
  {
    id: 'review-comparison',
    name: 'Comparison',
    category: 'review',
    preview: { bg: 'linear-gradient(90deg, #2193b0, #6dd5ed)', elements: ['side by side', 'vs', 'compare'] },
    canvasBg: '#0c1222',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 600, h: 720, color: '#3b82f6', opacity: 0.08, borderR: 0, rot: 0 },
      { type: 'rect', x: 680, y: 0, w: 600, h: 720, color: '#f59e0b', opacity: 0.08, borderR: 0, rot: 0 },
      { type: 'rect', x: 600, y: 0, w: 80, h: 720, color: '#ffffff', opacity: 0.05, borderR: 0, rot: 0 },
      { type: 'text', x: 100, y: 560, w: 400, h: 60, text: 'OPTION A', font: 'Impact', size: 48, bold: true, italic: false, color: '#60a5fa', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'text', x: 780, y: 560, w: 400, h: 60, text: 'OPTION B', font: 'Impact', size: 48, bold: true, italic: false, color: '#fbbf24', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
    ],
  },

  // ===== NEWS (2) =====
  {
    id: 'news-breaking',
    name: 'Breaking News',
    category: 'news',
    preview: { bg: 'linear-gradient(180deg, #b91c1c, #7f1d1d)', elements: ['BREAKING', 'banner', 'ticker'] },
    canvasBg: '#0a0a0a',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 100, color: '#dc2626', opacity: 1, borderR: 0, rot: 0 },
      { type: 'text', x: 40, y: 12, w: 1200, h: 80, text: 'BREAKING NEWS', font: 'Impact', size: 64, bold: true, italic: false, color: '#ffffff', shadow: 'none', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'text', x: 80, y: 200, w: 1120, h: 200, text: 'MAJOR UPDATE\nJUST ANNOUNCED', font: 'Impact', size: 96, bold: true, italic: false, color: '#ffffff', shadow: '0 4px 20px rgba(0,0,0,.6)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', lineHeight: 1.3 },
      { type: 'rect', x: 0, y: 620, w: 1280, h: 100, color: '#dc2626', opacity: 0.9, borderR: 0, rot: 0 },
      { type: 'text', x: 40, y: 640, w: 1200, h: 60, text: 'LIVE COVERAGE  |  FULL STORY INSIDE', font: 'Arial', size: 24, bold: true, italic: false, color: '#ffffff', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', letterSpacing: 2 },
    ],
  },
  {
    id: 'news-hot-take',
    name: 'Hot Take',
    category: 'news',
    preview: { bg: 'linear-gradient(135deg, #f12711, #f5af19)', elements: ['HOT TAKE', 'fire', 'bold'] },
    canvasBg: '#1a0800',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 720, color: '#f97316', opacity: 0.08, borderR: 0, rot: 0 },
      { type: 'text', x: 60, y: 80, w: 400, h: 60, text: 'HOT TAKE', font: 'Impact', size: 48, bold: true, italic: false, color: '#f97316', shadow: '0 0 20px rgba(249,115,22,.4)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', glow: { color: '#f97316', blur: 15, spread: 0 } },
      { type: 'rect', x: 60, y: 160, w: 200, h: 4, color: '#f97316', opacity: 0.6, borderR: 2, rot: 0 },
      { type: 'text', x: 60, y: 200, w: 1100, h: 300, text: 'THIS CHANGES\nEVERYTHING', font: 'Impact', size: 120, bold: true, italic: false, color: '#ffffff', shadow: '0 4px 20px rgba(0,0,0,.8)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', lineHeight: 1.2 },
      { type: 'text', x: 60, y: 560, w: 800, h: 40, text: 'My unpopular opinion...', font: 'Georgia', size: 28, bold: false, italic: true, color: '#fdba74', shadow: 'none', opacity: 0.6, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
    ],
  },

  // ===== MINIMAL (3) =====
  {
    id: 'minimal-clean-text',
    name: 'Clean Text',
    category: 'minimal',
    preview: { bg: 'linear-gradient(135deg, #1e1e2f, #2a2a4a)', elements: ['centered', 'bold', 'gradient'] },
    canvasBg: '#1e1e2f',
    elements: [
      { type: 'text', x: 80, y: 200, w: 1120, h: 160, text: 'YOUR TITLE HERE', font: 'Arial', size: 100, bold: true, italic: false, color: '#ffffff', shadow: 'none', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'rect', x: 500, y: 400, w: 280, h: 4, color: '#6366f1', opacity: 0.6, borderR: 2, rot: 0 },
      { type: 'text', x: 280, y: 440, w: 720, h: 50, text: 'A clean, minimal subtitle goes here', font: 'Georgia', size: 26, bold: false, italic: true, color: '#94a3b8', shadow: 'none', opacity: 0.7, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
    ],
  },
  {
    id: 'minimal-quote',
    name: 'Quote Style',
    category: 'minimal',
    preview: { bg: 'linear-gradient(135deg, #0c0c14, #1a1a2e)', elements: ['quote', 'marks', 'attribution'] },
    canvasBg: '#0c0c14',
    elements: [
      { type: 'text', x: 80, y: 100, w: 200, h: 200, text: '\u201C', font: 'Georgia', size: 200, bold: false, italic: false, color: '#6366f1', shadow: 'none', opacity: 0.3, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'text', x: 160, y: 200, w: 960, h: 200, text: 'The only limit is\nyour imagination', font: 'Georgia', size: 56, bold: false, italic: true, color: '#e2e8f0', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', lineHeight: 1.6 },
      { type: 'rect', x: 540, y: 460, w: 200, h: 3, color: '#6366f1', opacity: 0.4, borderR: 2, rot: 0 },
      { type: 'text', x: 340, y: 500, w: 600, h: 40, text: '- Your Name', font: 'Georgia', size: 24, bold: false, italic: true, color: '#64748b', shadow: 'none', opacity: 0.6, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
    ],
  },
  {
    id: 'minimal-logo-center',
    name: 'Logo Center',
    category: 'minimal',
    preview: { bg: 'linear-gradient(135deg, #0a0a0a, #1a1a1a)', elements: ['logo', 'placeholder', 'tagline'] },
    canvasBg: '#0a0a0a',
    elements: [
      { type: 'circle', x: 520, y: 160, w: 240, h: 240, color: '#6366f1', opacity: 0.15, rot: 0 },
      { type: 'text', x: 520, y: 210, w: 240, h: 140, text: 'LOGO', font: 'Arial', size: 40, bold: true, italic: false, color: '#6366f1', shadow: 'none', opacity: 0.5, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
      { type: 'rect', x: 540, y: 440, w: 200, h: 3, color: '#ffffff', opacity: 0.15, borderR: 2, rot: 0 },
      { type: 'text', x: 240, y: 480, w: 800, h: 60, text: 'YOUR BRAND NAME', font: 'Arial', size: 42, bold: true, italic: false, color: '#ffffff', shadow: 'none', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', letterSpacing: 8 },
      { type: 'text', x: 340, y: 560, w: 600, h: 40, text: 'Tagline goes here', font: 'Georgia', size: 22, bold: false, italic: true, color: '#64748b', shadow: 'none', opacity: 0.5, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center' },
    ],
  },

  // ===== BOLD (3) =====
  {
    id: 'bold-shock-face',
    name: 'Shock Face',
    category: 'bold',
    preview: { bg: 'linear-gradient(135deg, #f7971e, #ffd200)', elements: ['SHOCK', 'face area', '!!!'] },
    canvasBg: '#1a1200',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 720, color: '#f59e0b', opacity: 0.06, borderR: 0, rot: 0 },
      { type: 'circle', x: 760, y: 60, w: 460, h: 460, color: '#f59e0b', opacity: 0.08, rot: 0 },
      { type: 'text', x: 40, y: 80, w: 700, h: 200, text: 'OMG!!!', font: 'Impact', size: 140, bold: true, italic: false, color: '#fbbf24', shadow: '0 4px 20px rgba(251,191,36,.3)', opacity: 1, bg: 'transparent', borderR: 0, rot: -3, textAlign: 'left', glow: { color: '#fbbf24', blur: 12, spread: 0 } },
      { type: 'text', x: 40, y: 340, w: 700, h: 120, text: 'I CAN\'T BELIEVE\nTHIS HAPPENED', font: 'Impact', size: 64, bold: true, italic: false, color: '#ffffff', shadow: '0 4px 20px rgba(0,0,0,.8)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', lineHeight: 1.3 },
      { type: 'text', x: 40, y: 540, w: 600, h: 40, text: 'Watch until the end...', font: 'Georgia', size: 24, bold: false, italic: true, color: '#fcd34d', shadow: 'none', opacity: 0.5, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
    ],
  },
  {
    id: 'bold-money-shot',
    name: 'Money Shot',
    category: 'bold',
    preview: { bg: 'linear-gradient(135deg, #0f5132, #198754)', elements: ['$$$', 'green', 'numbers'] },
    canvasBg: '#052e16',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 1280, h: 720, color: '#10b981', opacity: 0.06, borderR: 0, rot: 0 },
      { type: 'text', x: 80, y: 60, w: 600, h: 160, text: '$10,000', font: 'Impact', size: 140, bold: true, italic: false, color: '#34d399', shadow: '0 0 30px rgba(52,211,153,.3)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', glow: { color: '#34d399', blur: 15, spread: 0 } },
      { type: 'text', x: 80, y: 250, w: 800, h: 80, text: 'IN JUST 30 DAYS', font: 'Impact', size: 64, bold: true, italic: false, color: '#ffffff', shadow: '0 4px 20px rgba(0,0,0,.8)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left' },
      { type: 'rect', x: 80, y: 360, w: 500, h: 4, color: '#10b981', opacity: 0.4, borderR: 2, rot: 0 },
      { type: 'text', x: 80, y: 400, w: 800, h: 50, text: 'FULL STRATEGY REVEALED', font: 'Arial', size: 28, bold: true, italic: false, color: '#6ee7b7', shadow: 'none', opacity: 0.6, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'left', letterSpacing: 5 },
    ],
  },
  {
    id: 'bold-controversy',
    name: 'Controversy',
    category: 'bold',
    preview: { bg: 'linear-gradient(135deg, #dc2626, #1a1a1a)', elements: ['red/black', 'split', 'impact'] },
    canvasBg: '#0a0a0a',
    elements: [
      { type: 'rect', x: 0, y: 0, w: 640, h: 720, color: '#dc2626', opacity: 0.12, borderR: 0, rot: 0 },
      { type: 'rect', x: 640, y: 0, w: 640, h: 720, color: '#111111', opacity: 0.5, borderR: 0, rot: 0 },
      { type: 'text', x: 60, y: 120, w: 1160, h: 200, text: 'THE TRUTH\nNOBODY TELLS', font: 'Impact', size: 100, bold: true, italic: false, color: '#ffffff', shadow: '0 4px 20px rgba(0,0,0,.8)', opacity: 1, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', lineHeight: 1.2 },
      { type: 'rect', x: 440, y: 380, w: 400, h: 6, color: '#dc2626', opacity: 0.8, borderR: 3, rot: 0 },
      { type: 'text', x: 240, y: 420, w: 800, h: 60, text: 'EXPOSED', font: 'Impact', size: 56, bold: true, italic: false, color: '#ef4444', shadow: '0 0 20px rgba(239,68,68,.3)', opacity: 0.9, bg: 'transparent', borderR: 0, rot: 0, textAlign: 'center', letterSpacing: 10, glow: { color: '#ef4444', blur: 12, spread: 0 } },
    ],
  },
];
