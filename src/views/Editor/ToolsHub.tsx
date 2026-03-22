'use client';

import { useState, useMemo, useCallback, useRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';
import type { Theme } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════════════
   TOOL DEFINITIONS
   ═══════════════════════════════════════════════════════════════════ */

type ToolCategory = 'all' | 'creation' | 'optimization' | 'audio' | 'publishing' | 'ai' | 'video' | 'free' | 'downloaders';

interface ToolDef {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  category: ToolCategory;
  route?: string;
  available: boolean;
  badge?: string;
  gradient: [string, string];
}

function getTools(t: (key: string) => string): ToolDef[] {
  return [
  /* ── Core Studio Tools ─────────────────────────────── */
  {
    id: 'video',
    name: t('toolshub.tool.video.name'),
    subtitle: t('toolshub.tool.video.subtitle'),
    description: t('toolshub.tool.video.description'),
    category: 'creation',
    route: '/editor',
    available: true,
    badge: t('toolshub.popular'),
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'thumbnails',
    name: t('toolshub.tool.thumbnails.name'),
    subtitle: 'Canvas · DALL-E 3',
    description: t('toolshub.tool.thumbnails.description'),
    category: 'creation',
    route: '/thumbnails',
    available: true,
    gradient: ['#ec4899', '#f43f5e'],
  },
  {
    id: 'metadata',
    name: t('toolshub.tool.metadata.name'),
    subtitle: t('toolshub.tool.metadata.subtitle'),
    description: t('toolshub.tool.metadata.description'),
    category: 'optimization',
    route: '/metadata',
    available: true,
    gradient: ['#14b8a6', '#06b6d4'],
  },
  {
    id: 'preview',
    name: t('toolshub.tool.preview.name'),
    subtitle: t('toolshub.tool.preview.subtitle'),
    description: t('toolshub.tool.preview.description'),
    category: 'publishing',
    route: '/preview',
    available: true,
    gradient: ['#f59e0b', '#f97316'],
  },

  /* ── AI Tools ──────────────────────────────────────── */
  {
    id: 'image-generator',
    name: 'AI Image Generator',
    subtitle: t('toolshub.tool.image-generator.subtitle'),
    description: t('toolshub.tool.image-generator.description'),
    category: 'ai',
    route: '/tools/image-generator',
    available: true,
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'voiceover-generator',
    name: 'AI Voiceover Generator',
    subtitle: t('toolshub.tool.voiceover-generator.subtitle'),
    description: t('toolshub.tool.voiceover-generator.description'),
    category: 'ai',
    route: '/tools/voiceover-generator',
    available: true,
    gradient: ['#3b82f6', '#6366f1'],
  },
  {
    id: 'speech-enhancer',
    name: 'AI Speech Enhancer',
    subtitle: t('toolshub.tool.speech-enhancer.subtitle'),
    description: t('toolshub.tool.speech-enhancer.description'),
    category: 'ai',
    route: '/tools/speech-enhancer',
    available: false,
    gradient: ['#10b981', '#06b6d4'],
  },
  {
    id: 'veo3-generator',
    name: 'AI Video Generator',
    subtitle: t('toolshub.tool.veo3-generator.subtitle'),
    description: t('toolshub.tool.veo3-generator.description'),
    category: 'ai',
    route: '/tools/veo3-generator',
    available: false,
    gradient: ['#ef4444', '#f97316'],
  },
  {
    id: 'brainstormer',
    name: 'AI Brainstormer',
    subtitle: t('toolshub.tool.brainstormer.subtitle'),
    description: t('toolshub.tool.brainstormer.description'),
    category: 'ai',
    route: '/tools/brainstormer',
    available: false,
    gradient: ['#8b5cf6', '#a78bfa'],
  },
  {
    id: 'vocal-remover',
    name: 'AI Vocal Remover',
    subtitle: t('toolshub.tool.vocal-remover.subtitle'),
    description: t('toolshub.tool.vocal-remover.description'),
    category: 'ai',
    route: '/tools/vocal-remover',
    available: false,
    gradient: ['#d946ef', '#c026d3'],
  },
  {
    id: 'ai-creator',
    name: 'AI Creator',
    subtitle: t('toolshub.tool.ai-creator.subtitle'),
    description: t('toolshub.tool.ai-creator.description'),
    category: 'ai',
    route: '/tools/ai-creator',
    available: false,
    gradient: ['#f59e0b', '#f97316'],
  },

  /* ── Video Tools ───────────────────────────────────── */
  {
    id: 'autoclip',
    name: 'AutoClip',
    subtitle: t('toolshub.tool.autoclip.subtitle'),
    description: t('toolshub.tool.autoclip.description'),
    category: 'video',
    route: '/tools/autoclip',
    available: false,
    badge: t('toolshub.popular'),
    gradient: ['#6366f1', '#ec4899'],
  },
  {
    id: 'cut-crop',
    name: 'Cut & Crop',
    subtitle: t('toolshub.tool.cut-crop.subtitle'),
    description: t('toolshub.tool.cut-crop.description'),
    category: 'video',
    route: '/tools/cut-crop',
    available: true,
    gradient: ['#3b82f6', '#06b6d4'],
  },
  {
    id: 'subtitle-editor',
    name: 'Subtitle Editor',
    subtitle: t('toolshub.tool.subtitle-editor.subtitle'),
    description: t('toolshub.tool.subtitle-editor.description'),
    category: 'video',
    route: '/tools/subtitle-editor',
    available: true,
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'subtitle-remover',
    name: 'Subtitle Remover',
    subtitle: t('toolshub.tool.subtitle-remover.subtitle'),
    description: t('toolshub.tool.subtitle-remover.description'),
    category: 'video',
    route: '/tools/subtitle-remover',
    available: false,
    gradient: ['#ef4444', '#f97316'],
  },
  {
    id: 'reddit-video',
    name: 'Reddit Video Generator',
    subtitle: 'Reddit · Shorts',
    description: t('toolshub.tool.reddit-video.description'),
    category: 'video',
    route: '/tools/reddit-video',
    available: false,
    gradient: ['#f97316', '#ef4444'],
  },
  {
    id: 'fake-texts',
    name: 'Fake Texts Video',
    subtitle: t('toolshub.tool.fake-texts.subtitle'),
    description: t('toolshub.tool.fake-texts.description'),
    category: 'video',
    route: '/tools/fake-texts',
    available: false,
    gradient: ['#8b5cf6', '#6366f1'],
  },

  /* ── Optimization ─────────────────────────────────── */
  {
    id: 'youtube-downloader',
    name: 'YouTube Video Analyzer',
    subtitle: t('toolshub.tool.youtube-downloader.subtitle'),
    description: t('toolshub.tool.youtube-downloader.description'),
    category: 'optimization',
    route: '/tools/youtube-downloader',
    available: true,
    gradient: ['#6366f1', '#8b5cf6'],
  },
  {
    id: 'tiktok-downloader',
    name: 'TikTok Downloader',
    subtitle: t('toolshub.tool.tiktok-downloader.subtitle'),
    description: t('toolshub.tool.tiktok-downloader.description'),
    category: 'downloaders',
    route: '/tools/tiktok-downloader',
    available: false,
    gradient: ['#010101', '#333333'],
  },

  /* ── Free Tools ────────────────────────────────────── */
  {
    id: 'audio-balancer',
    name: 'Audio Balancer',
    subtitle: t('toolshub.tool.audio-balancer.subtitle'),
    description: t('toolshub.tool.audio-balancer.description'),
    category: 'free',
    route: '/tools/audio-balancer',
    available: false,
    gradient: ['#3b82f6', '#6366f1'],
  },
  {
    id: 'video-compressor',
    name: 'Video Compressor',
    subtitle: t('toolshub.tool.video-compressor.subtitle'),
    description: t('toolshub.tool.video-compressor.description'),
    category: 'free',
    route: '/tools/video-compressor',
    available: true,
    gradient: ['#06b6d4', '#0ea5e9'],
  },
  {
    id: 'mp3-converter',
    name: 'MP3 Converter',
    subtitle: t('toolshub.tool.mp3-converter.subtitle'),
    description: t('toolshub.tool.mp3-converter.description'),
    category: 'free',
    route: '/tools/mp3-converter',
    available: true,
    gradient: ['#10b981', '#059669'],
  },

  /* ── More Tools ────────────────────────────────────── */
  {
    id: 'background-remover',
    name: 'Background Remover',
    subtitle: t('toolshub.tool.background-remover.subtitle'),
    description: t('toolshub.tool.background-remover.description'),
    category: 'ai',
    route: '/tools/background-remover',
    available: true,
    badge: 'Beta',
    gradient: ['#8b5cf6', '#7c3aed'],
  },
  {
    id: 'voice-changer',
    name: 'Voice Changer',
    subtitle: t('toolshub.tool.voice-changer.subtitle'),
    description: t('toolshub.tool.voice-changer.description'),
    category: 'audio',
    route: '/tools/voice-changer',
    available: false,
    gradient: ['#d946ef', '#a855f7'],
  },
  {
    id: 'face-swap',
    name: 'AI Face Swap',
    subtitle: t('toolshub.tool.face-swap.subtitle'),
    description: t('toolshub.tool.face-swap.description'),
    category: 'ai',
    route: '/tools/face-swap',
    available: false,
    gradient: ['#f97316', '#ef4444'],
  },

  /* ── New Tools ────────────────────────────────────── */
  {
    id: 'content-planner',
    name: 'Content Planner',
    subtitle: 'Calendar · Ideas · Templates',
    description: 'Plan, schedule, and organize your content across all platforms with calendar, ideas bank, and templates.',
    category: 'publishing',
    route: '/tools/content-planner',
    available: true,
    badge: 'NEW',
    gradient: ['#06b6d4', '#8b5cf6'],
  },
  {
    id: 'ai-video-generator',
    name: 'AI Video Generator',
    subtitle: 'Runway · Kling · Pika · Veo',
    description: 'Explore AI video generation services — Runway ML, Kling AI, Pika, Luma, Google Veo 2 and more.',
    category: 'ai',
    route: '/tools/ai-video-generator',
    available: true,
    badge: 'NEW',
    gradient: ['#8b5cf6', '#ec4899'],
  },

  /* ── Coming Soon ───────────────────────────────────── */
  {
    id: 'scenario',
    name: t('toolshub.tool.scenario.name'),
    subtitle: t('toolshub.tool.scenario.subtitle'),
    description: t('toolshub.tool.scenario.description'),
    category: 'creation',
    available: false,
    gradient: ['#8b5cf6', '#a78bfa'],
  },
  {
    id: 'video-translator',
    name: 'Video Translator',
    subtitle: 'AI · Voice Cloning · 30+ Languages',
    description: 'Translate videos to 30+ languages with AI voice cloning',
    category: 'ai',
    route: '/tools/video-translator',
    available: true,
    badge: 'Beta',
    gradient: ['#06b6d4', '#0ea5e9'],
  },
  {
    id: 'analytics',
    name: t('toolshub.tool.analytics.name'),
    subtitle: 'YouTube · Data API',
    description: t('toolshub.tool.analytics.description'),
    category: 'optimization',
    available: false,
    gradient: ['#f43f5e', '#fb7185'],
  },
  {
    id: 'scheduler',
    name: t('toolshub.tool.scheduler.name'),
    subtitle: t('toolshub.tool.scheduler.subtitle'),
    description: t('toolshub.tool.scheduler.description'),
    category: 'publishing',
    available: false,
    gradient: ['#0ea5e9', '#38bdf8'],
  },
  ];
}

function getCategories(t: (key: string) => string): { key: ToolCategory; label: string }[] {
  return [
  { key: 'all', label: t('toolshub.cat.all') },
  { key: 'ai', label: t('toolshub.cat.ai') },
  { key: 'video', label: t('toolshub.cat.video') },
  { key: 'audio', label: t('toolshub.cat.audio') },
  { key: 'creation', label: t('toolshub.cat.creation') },
  { key: 'downloaders', label: t('toolshub.cat.downloaders') },
  { key: 'free', label: t('toolshub.cat.free') },
  { key: 'optimization', label: t('toolshub.cat.optimization') },
  { key: 'publishing', label: t('toolshub.cat.publishing') },
  ];
}

/* ═══════════════════════════════════════════════════════════════════
   SVG ICONS FOR TOOLS
   ═══════════════════════════════════════════════════════════════════ */

const TOOL_ICONS: Record<string, (color: string) => React.ReactNode> = {
  video: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  thumbnails: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  metadata: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  preview: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  scenario: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  voice: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  subtitles: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><line x1="6" y1="14" x2="10" y2="14" /><line x1="12" y1="14" x2="18" y2="14" /><line x1="6" y1="18" x2="14" y2="18" />
    </svg>
  ),
  montage: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="7.5 4.21 12 6.81 16.5 4.21" /><polyline points="7.5 19.79 7.5 14.6 3 12" /><polyline points="21 12 16.5 14.6 16.5 19.79" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  translate: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="5" x2="16" y2="5" /><line x1="9" y1="1" x2="9" y2="5" /><path d="M5 5c0 4 3 7.5 7 8.5" /><path d="M13 5c0 3-1.5 5.5-4 7" />
      <path d="M14 17l3-6 3 6" /><line x1="14.5" y1="15.5" x2="19.5" y2="15.5" /><path d="M22 22L14 14" />
    </svg>
  ),
  music: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  analytics: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  scheduler: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /><path d="M8 18h.01" /><path d="M12 18h.01" />
    </svg>
  ),
  templates: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  'ab-test': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" />
    </svg>
  ),
  collaboration: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  /* ── New tool icons ────────────── */
  'image-generator': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  'voiceover-generator': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  'speech-enhancer': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 10v3" /><path d="M6 6v11" /><path d="M10 3v18" /><path d="M14 8v7" /><path d="M18 5v13" /><path d="M22 10v3" />
    </svg>
  ),
  'veo3-generator': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" />
      <path d="M12 2l1 3h3l-2.5 2 1 3L12 8l-2.5 2 1-3L8 5h3l1-3z" fill={c} stroke="none" opacity=".4" />
    </svg>
  ),
  brainstormer: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  'vocal-remover': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
      <line x1="2" y1="2" x2="22" y2="22" strokeWidth="2" />
    </svg>
  ),
  'ai-creator': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" /><path d="M20 21a8 8 0 10-16 0" />
      <path d="M12 2l1 2h2l-1.5 1.5.5 2L12 6l-2 1.5.5-2L9 4h2l1-2z" fill={c} stroke="none" opacity=".5" />
    </svg>
  ),
  autoclip: (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M10 4v16" /><polygon points="14 10 18 12.5 14 15" fill={c} stroke="none" opacity=".6" />
    </svg>
  ),
  'cut-crop': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.13 1L6 16a2 2 0 002 2h15" /><path d="M1 6.13L16 6a2 2 0 012 2v15" />
    </svg>
  ),
  'subtitle-editor': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><line x1="6" y1="14" x2="10" y2="14" /><line x1="12" y1="14" x2="18" y2="14" /><line x1="6" y1="18" x2="14" y2="18" />
    </svg>
  ),
  'subtitle-remover': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" /><line x1="6" y1="16" x2="18" y2="16" opacity=".3" /><line x1="4" y1="8" x2="20" y2="20" strokeWidth="2.5" />
    </svg>
  ),
  'reddit-video': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" /><circle cx="8" cy="11" r="1.5" fill={c} stroke="none" /><circle cx="16" cy="11" r="1.5" fill={c} stroke="none" />
      <path d="M8 15c1.5 1.5 6.5 1.5 8 0" strokeLinecap="round" />
    </svg>
  ),
  'fake-texts': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /><line x1="8" y1="9" x2="16" y2="9" /><line x1="8" y1="13" x2="13" y2="13" />
    </svg>
  ),
  'youtube-downloader': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /><line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  'tiktok-downloader': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 12a4 4 0 104 4V4c1.5 2 4 3 6 3" />
    </svg>
  ),
  'audio-balancer': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  'video-compressor': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" /><path d="M9 4v16" /><path d="M15 4v16" /><path d="M4 12h16" />
    </svg>
  ),
  'mp3-converter': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
      <path d="M10 13v4" /><path d="M14 11v6" /><path d="M8 15v2" /><path d="M16 14v3" />
    </svg>
  ),
  'background-remover': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="12" cy="12" r="4" /><path d="M3 3l18 18" opacity=".3" />
    </svg>
  ),
  'voice-changer': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" /><path d="M19 10v2a7 7 0 01-14 0v-2" />
      <path d="M5 3l14 14" strokeWidth="2" />
    </svg>
  ),
  'face-swap': (c) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="5" /><circle cx="15" cy="15" r="5" /><path d="M16 8l2-2 2 2" /><path d="M8 16l-2 2-2-2" />
    </svg>
  ),
};

/* ═══════════════════════════════════════════════════════════════════
   SEARCH ICON
   ═══════════════════════════════════════════════════════════════════ */

function SearchIcon({ size = 18, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SparkleIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none">
      <path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" />
    </svg>
  );
}

function ArrowIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" />
    </svg>
  );
}

function LockIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TOOL CARD
   ═══════════════════════════════════════════════════════════════════ */

const ToolCard = memo(function ToolCard({
  tool,
  C,
  onOpen,
}: {
  tool: ToolDef;
  C: Theme;
  onOpen: (tool: ToolDef) => void;
}) {
  const t = useLocaleStore((s) => s.t);
  const [hovered, setHovered] = useState(false);
  const iconFn = TOOL_ICONS[tool.id];

  return (
    <div
      role="button"
      tabIndex={tool.available ? 0 : -1}
      aria-label={tool.available ? `${t('toolshub.openTool')} ${tool.name}` : `${tool.name} — ${t('toolshub.comingSoon')}`}
      onClick={() => tool.available && onOpen(tool)}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && tool.available) {
          e.preventDefault();
          onOpen(tool);
        }
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.06)',
        background: '#1a1a1a',
        cursor: tool.available ? 'pointer' : 'default',
        transition: 'all .25s ease',
        transform: hovered && tool.available ? 'translateY(-2px)' : 'none',
        boxShadow: hovered && tool.available
          ? '0 8px 30px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)'
          : 'none',
        overflow: 'hidden',
        opacity: tool.available ? 1 : 0.55,
      }}
    >
      {/* Badge */}
      {tool.badge && tool.available && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          padding: '3px 10px',
          borderRadius: 20,
          background: tool.badge === 'NEW'
            ? `${tool.gradient[0]}25`
            : tool.badge === 'Beta'
              ? 'rgba(255,255,255,0.08)'
              : tool.badge === 'Free'
                ? '#22c55e25'
                : `${tool.gradient[0]}25`,
          color: tool.badge === 'NEW'
            ? tool.gradient[0]
            : tool.badge === 'Beta'
              ? 'rgba(255,255,255,0.5)'
              : tool.badge === 'Free'
                ? '#22c55e'
                : tool.gradient[0],
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '.02em',
          zIndex: 2,
        }}>
          {tool.badge}
        </div>
      )}

      {/* Coming soon badge */}
      {!tool.available && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '3px 10px',
          borderRadius: 20,
          background: 'rgba(255,255,255,0.06)',
          border: 'none',
          color: 'rgba(255,255,255,0.35)',
          fontSize: 10,
          fontWeight: 600,
          zIndex: 2,
        }}>
          <LockIcon size={10} color="rgba(255,255,255,0.35)" />
          {t('toolshub.comingSoonLabel')}
        </div>
      )}

      {/* Icon + content area */}
      <div style={{
        padding: '20px 16px 14px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
      }}>
        {/* Icon container — 48x48 accent-tinted circle */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: tool.available
            ? `${tool.gradient[0]}20`
            : 'rgba(255,255,255,0.06)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'all .2s',
          transform: hovered && tool.available ? 'scale(1.05)' : 'none',
        }}>
          {iconFn ? iconFn(tool.available ? tool.gradient[0] : 'rgba(255,255,255,0.35)') : null}
        </div>

        {/* Name + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 600,
            color: tool.available ? '#ffffff' : 'rgba(255,255,255,0.35)',
            marginBottom: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            wordBreak: 'break-word',
          }}>
            {tool.name}
          </div>
          <div style={{
            fontSize: 11,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 500,
          }}>
            {tool.subtitle}
          </div>
        </div>

        {/* Arrow */}
        {tool.available && (
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: hovered ? tool.gradient[0] + '20' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all .2s',
            flexShrink: 0,
            marginTop: 2,
          }}>
            <ArrowIcon size={14} color={hovered ? tool.gradient[0] : 'rgba(255,255,255,0.3)'} />
          </div>
        )}
      </div>

      {/* Description — 2 lines max */}
      <div style={{
        padding: '0 16px 16px',
        fontSize: 13,
        lineHeight: 1.5,
        color: 'rgba(255,255,255,0.5)',
        wordBreak: 'break-word',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {tool.description}
      </div>

      {/* Bottom action bar — only for available tools */}
      {tool.available && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            fontWeight: 600,
            color: '#22c55e',
            padding: '2px 8px',
            borderRadius: 20,
            background: '#22c55e18',
          }}>
            <SparkleIcon size={10} color="#22c55e" />
            {t('toolshub.availableLabel')}
          </span>
          <span
            role="link"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onOpen(tool);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onOpen(tool);
              }
            }}
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: hovered ? tool.gradient[0] : 'rgba(255,255,255,0.35)',
              cursor: 'pointer',
              transition: 'color .2s',
            }}
          >
            {t('toolshub.openArrow')}
          </span>
        </div>
      )}

      {/* Bottom bar — coming soon tools */}
      {!tool.available && (
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.3)',
            padding: '2px 8px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.04)',
          }}>
            {t('toolshub.comingSoonSoon')}
          </span>
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   CATEGORY TAB
   ═══════════════════════════════════════════════════════════════════ */

const CategoryTab = memo(function CategoryTab({
  label,
  active,
  C,
  categoryKey,
  onSelect,
}: {
  label: string;
  active: boolean;
  C: Theme;
  categoryKey: ToolCategory;
  onSelect: (key: ToolCategory) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const handleClick = useCallback(() => onSelect(categoryKey), [onSelect, categoryKey]);
  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '8px 18px',
        minHeight: 36,
        borderRadius: 20,
        border: active ? 'none' : '1px solid rgba(255,255,255,0.08)',
        background: active
          ? `${C.accent}`
          : hovered ? 'rgba(255,255,255,0.06)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.6)',
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        cursor: 'pointer',
        transition: 'all .2s',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
});

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT — TOOLS HUB
   ═══════════════════════════════════════════════════════════════════ */

export function ToolsHub() {
  const C = useThemeStore((s) => s.theme);
  const t = useLocaleStore((s) => s.t);
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ToolCategory>('all');

  const TOOLS = useMemo(() => getTools(t), [t]);
  const CATEGORIES = useMemo(() => getCategories(t), [t]);

  const filtered = useMemo(() => {
    let list = TOOLS;
    if (category !== 'all') {
      list = list.filter((t) => t.category === category);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.subtitle.toLowerCase().includes(q),
      );
    }
    // Available first, then coming soon
    return [...list].sort((a, b) => (a.available === b.available ? 0 : a.available ? -1 : 1));
  }, [TOOLS, search, category]);

  const handleOpen = useCallback(
    (tool: ToolDef) => {
      if (tool.route) {
        router.push(tool.route);
      }
    },
    [router],
  );

  const handleSetCategory = useCallback((key: ToolCategory) => {
    setCategory(key);
  }, []);

  const availableCount = useMemo(() => TOOLS.filter((t) => t.available).length, [TOOLS]);
  const comingSoonCount = useMemo(() => TOOLS.filter((t) => !t.available).length, [TOOLS]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 1200,
      margin: '0 auto',
      padding: '0 16px',
      boxSizing: 'border-box',
    }}>
      {/* ── Hero Section ──────────────────────────────────── */}
      <div className="tf-tools-hero" style={{
        textAlign: 'center',
        padding: '32px 0 16px',
      }}>
        <h1 className="tf-tools-hero-title" style={{
          fontSize: 28,
          fontWeight: 700,
          color: '#ffffff',
          margin: 0,
          lineHeight: 1.2,
          letterSpacing: '-0.02em',
        }}>
          {t('toolshub.title')}
        </h1>
        <p style={{
          fontSize: 16,
          color: 'rgba(255,255,255,0.5)',
          margin: '12px 0 0',
          lineHeight: 1.5,
        }}>
          {t('toolshub.subtitle')}
        </p>
      </div>

      {/* ── Search Bar — centered pill ──────────────────── */}
      <div style={{
        maxWidth: 560,
        width: '100%',
        margin: '0 auto 12px',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute',
          left: 18,
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          pointerEvents: 'none',
        }}>
          <SearchIcon size={18} color="rgba(255,255,255,0.35)" />
        </div>
        <input
          ref={searchRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('toolshub.searchPlaceholder')}
          style={{
            width: '100%',
            height: 48,
            padding: '0 16px 0 48px',
            borderRadius: 22,
            border: 'none',
            background: 'rgba(255,255,255,0.04)',
            color: '#ffffff',
            fontSize: 14,
            fontFamily: 'inherit',
            outline: 'none',
            transition: 'box-shadow .2s',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.boxShadow = `0 0 0 2px ${C.accent}44`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        {search && (
          <button
            onClick={() => { setSearch(''); searchRef.current?.focus(); }}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 24,
              height: 24,
              borderRadius: 12,
              border: 'none',
              background: 'rgba(255,255,255,0.15)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontFamily: 'inherit',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Counters ──────────────────────────────────────── */}
      <div style={{
        textAlign: 'center',
        marginBottom: 20,
        fontSize: 13,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 500,
      }}>
        {availableCount} {t('toolshub.available')} &bull; {comingSoonCount} {t('toolshub.comingSoon')}
      </div>

      {/* ── Category Tabs — horizontal pills ────────────── */}
      <div className="tf-tools-cats" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 28,
        overflowX: 'auto',
        paddingBottom: 4,
        justifyContent: 'center',
        flexWrap: 'wrap',
      }}>
        {CATEGORIES.map((cat) => (
          <CategoryTab
            key={cat.key}
            label={cat.label}
            active={category === cat.key}
            C={C}
            categoryKey={cat.key}
            onSelect={handleSetCategory}
          />
        ))}
      </div>

      {/* ── Tools Grid ──────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: C.dim,
        }}>
          <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
            {t('toolshub.nothingFound')}
          </div>
          <div style={{ fontSize: 13 }}>
            {t('toolshub.tryDifferent')}
          </div>
        </div>
      ) : (
        <div className="tf-tools-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          paddingBottom: 60,
        }}>
          {filtered.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              C={C}
              onOpen={handleOpen}
            />
          ))}
        </div>
      )}
    </div>
  );
}
