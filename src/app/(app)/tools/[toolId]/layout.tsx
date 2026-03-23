import type { Metadata } from 'next';

/* ── Tool display info for metadata ─────────────────────────────── */

const TOOL_META: Record<string, { name: string; description: string }> = {
  'image-generator': {
    name: 'AI Image Generator',
    description: 'Generate high-quality images from text descriptions using AI. Create thumbnails, B-roll stills, and custom graphics for your YouTube channel.',
  },
  'voiceover-generator': {
    name: 'AI Voiceover Generator',
    description: 'Generate realistic AI narration in dozens of voices and languages. Perfect for compilation channels, explainer videos, and professional voiceover.',
  },
  'speech-enhancer': {
    name: 'Speech Enhancer',
    description: 'Remove background noise and improve voice quality in your recordings with AI-powered audio enhancement.',
  },
  'veo3-generator': {
    name: 'Veo 3 Video Generator',
    description: 'Generate AI video clips from text descriptions using Google Veo 3 technology.',
  },
  'brainstormer': {
    name: 'AI Brainstormer',
    description: 'Generate video ideas, titles, and content strategies with AI-powered brainstorming for YouTube creators.',
  },
  'vocal-remover': {
    name: 'Vocal Remover',
    description: 'Extract vocals from music or remove vocals from audio tracks using AI separation technology.',
  },
  'ai-creator': {
    name: 'AI Creator',
    description: 'AI-powered video creation assistant for YouTube creators. Generate scripts, storyboards, and video concepts.',
  },
  'autoclip': {
    name: 'Auto Clip',
    description: 'Automatically identify and clip the most engaging segments from your long-form videos into YouTube Shorts format.',
  },
  'cut-crop': {
    name: 'Cut & Crop',
    description: 'Trim, cut, and crop your videos directly in the browser. Resize for YouTube, Shorts, TikTok, and Instagram Reels.',
  },
  'subtitle-editor': {
    name: 'Subtitle Editor',
    description: 'AI-powered subtitle generation and editing in 50+ languages. Auto-translate, style, and export subtitles in SRT, VTT, and ASS formats.',
  },
  'subtitle-remover': {
    name: 'Subtitle Remover',
    description: 'Remove hardcoded subtitles from videos using AI inpainting technology.',
  },
  'reddit-video': {
    name: 'Reddit Video Generator',
    description: 'Generate engaging Reddit story videos with AI narration, text overlays, and background gameplay.',
  },
  'fake-texts': {
    name: 'Fake Texts Generator',
    description: 'Create realistic text message conversation screenshots for storytelling and content creation.',
  },
  'youtube-downloader': {
    name: 'YouTube Downloader',
    description: 'Download YouTube videos in multiple formats and resolutions. Save videos for offline editing and reference.',
  },
  'tiktok-downloader': {
    name: 'TikTok Downloader',
    description: 'Download TikTok videos without watermarks in high quality for cross-platform content repurposing.',
  },
  'audio-balancer': {
    name: 'Audio Balancer',
    description: 'Balance audio levels across your video tracks. Normalize volume, reduce peaks, and ensure consistent audio quality.',
  },
  'video-compressor': {
    name: 'Video Compressor',
    description: 'Compress video files while maintaining quality. Reduce file sizes for faster uploads and smoother streaming.',
  },
  'mp3-converter': {
    name: 'MP3 Converter',
    description: 'Convert audio and video files to MP3 format. Extract audio from videos for podcasts and music.',
  },
  'background-remover': {
    name: 'Background Remover',
    description: 'Remove or replace backgrounds from images and video frames instantly with AI. Create clean, professional thumbnails.',
  },
  'voice-changer': {
    name: 'Voice Changer',
    description: 'Change your voice in real-time or post-production using AI voice transformation technology.',
  },
  'face-swap': {
    name: 'Face Swap',
    description: 'AI-powered face swapping for creative video content and entertainment.',
  },
  'ai-video-generator': {
    name: 'AI Video Generator',
    description: 'Generate video content from text descriptions using AI. Create B-roll, transitions, and video sequences for your YouTube channel.',
  },
  'content-planner': {
    name: 'Content Planner',
    description: 'Plan your YouTube content calendar with AI-powered topic suggestions, trending keyword analysis, and scheduling tools.',
  },
  'video-translator': {
    name: 'Video Translator',
    description: 'Translate your videos into 50+ languages with AI-powered dubbing, subtitle generation, and lip-sync technology. Reach a global audience.',
  },
};

/* ── generateMetadata ────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ toolId: string }>;
}): Promise<Metadata> {
  const { toolId } = await params;
  const meta = TOOL_META[toolId];
  if (!meta) return {};

  const title = `${meta.name} — Free AI Tool | TubeForge`;

  return {
    title,
    description: meta.description,
    openGraph: {
      title,
      description: meta.description,
      type: 'website',
      locale: 'en_US',
      url: `https://tubeforge.co/tools/${toolId}`,
      images: [{ url: '/api/og', width: 1200, height: 630, alt: meta.name }],
    },
    alternates: {
      canonical: `https://tubeforge.co/tools/${toolId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: meta.description,
      images: ['/api/og'],
    },
  };
}

/* ── SoftwareApplication JSON-LD for tool pages ──────────────────── */

function buildSoftwareApplicationJsonLd(toolId: string) {
  const meta = TOOL_META[toolId];
  if (!meta) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `TubeForge ${meta.name}`,
    description: meta.description,
    url: `https://tubeforge.co/tools/${toolId}`,
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: 'TubeForge',
      url: 'https://tubeforge.co',
    },
  };
}

/* ── Layout ──────────────────────────────────────────────────────── */

export default async function ToolLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ toolId: string }>;
}) {
  const { toolId } = await params;
  const jsonLd = buildSoftwareApplicationJsonLd(toolId);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
