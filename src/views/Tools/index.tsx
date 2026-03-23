/* Tool registry — maps tool IDs to their lazy-loaded components */
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

const loader = () => <Skeleton width="100%" height="60vh" />;

export const TOOL_COMPONENTS: Record<string, React.ComponentType> = {};

/* Lazy load all tool components */
const tools: Record<string, () => Promise<{ [key: string]: React.ComponentType }>> = {
  'image-generator': () => import('./ImageGenerator'),
  'voiceover-generator': () => import('./VoiceoverGenerator'),
  'speech-enhancer': () => import('./SpeechEnhancer'),
  'veo3-generator': () => import('./Veo3Generator'),
  'brainstormer': () => import('./Brainstormer'),
  'vocal-remover': () => import('./VocalRemover'),
  'ai-creator': () => import('./AiCreator'),
  'autoclip': () => import('./AutoClip'),
  'cut-crop': () => import('./CutCrop'),
  'subtitle-editor': () => import('./SubtitleEditor'),
  'subtitle-remover': () => import('./SubtitleRemover'),
  'reddit-video': () => import('./RedditVideoGenerator'),
  'fake-texts': () => import('./FakeTextsGenerator'),
  'youtube-downloader': () => import('./YoutubeDownloader'),
  'tiktok-downloader': () => import('./TiktokDownloader'),
  'audio-balancer': () => import('./AudioBalancer'),
  'video-compressor': () => import('./VideoCompressor'),
  'mp3-converter': () => import('./Mp3Converter'),
  'background-remover': () => import('./BackgroundRemover'),
  'voice-changer': () => import('./VoiceChanger'),
  'face-swap': () => import('./FaceSwap'),
  'ai-video-generator': () => import('./AiVideoGenerator'),
  'content-planner': () => import('./ContentPlanner'),
  'video-translator': () => import('./VideoTranslator'),
  'mp4-to-gif': () => import('./Mp4ToGif'),
  'multi-publisher': () => import('./MultiPublisher'),
};

const COMPONENT_NAMES: Record<string, string> = {
  'image-generator': 'ImageGenerator',
  'voiceover-generator': 'VoiceoverGenerator',
  'speech-enhancer': 'SpeechEnhancer',
  'veo3-generator': 'Veo3Generator',
  'brainstormer': 'Brainstormer',
  'vocal-remover': 'VocalRemover',
  'ai-creator': 'AiCreator',
  'autoclip': 'AutoClip',
  'cut-crop': 'CutCrop',
  'subtitle-editor': 'SubtitleEditor',
  'subtitle-remover': 'SubtitleRemover',
  'reddit-video': 'RedditVideoGenerator',
  'fake-texts': 'FakeTextsGenerator',
  'youtube-downloader': 'YoutubeDownloader',
  'tiktok-downloader': 'TiktokDownloader',
  'audio-balancer': 'AudioBalancer',
  'video-compressor': 'VideoCompressor',
  'mp3-converter': 'Mp3Converter',
  'background-remover': 'BackgroundRemover',
  'voice-changer': 'VoiceChanger',
  'face-swap': 'FaceSwap',
  'ai-video-generator': 'AiVideoGenerator',
  'content-planner': 'ContentPlanner',
  'video-translator': 'VideoTranslator',
  'mp4-to-gif': 'Mp4ToGif',
  'multi-publisher': 'MultiPublisher',
};

/**
 * Wraps a lazy-loaded tool component in ErrorBoundary + Suspense so one
 * broken tool doesn't crash the whole page.
 */
function createToolWrapper(LazyComponent: React.ComponentType, displayName: string) {
  function ToolWithBoundary() {
    return (
      <ErrorBoundary>
        <Suspense fallback={<Skeleton width="100%" height="60vh" />}>
          <LazyComponent />
        </Suspense>
      </ErrorBoundary>
    );
  }
  ToolWithBoundary.displayName = `ErrorBoundary(${displayName})`;
  return ToolWithBoundary;
}

/* Create dynamic components for each tool, each wrapped in ErrorBoundary + Suspense */
for (const [id, importFn] of Object.entries(tools)) {
  const name = COMPONENT_NAMES[id]!;
  const LazyComponent = dynamic(
    () => importFn().then((m) => ({ default: (m as Record<string, React.ComponentType>)[name] })),
    { loading: loader, ssr: false },
  );
  TOOL_COMPONENTS[id] = createToolWrapper(LazyComponent, name);
}

export const TOOL_IDS = Object.keys(tools);

/**
 * Tool IDs that are currently available (not "coming soon").
 * Must match the `available: true` flags in ToolsHub.tsx.
 */
export const AVAILABLE_TOOL_IDS = new Set([
  'cut-crop',
  'youtube-downloader',
  'video-compressor',
  'mp3-converter',
  'content-planner',
  'ai-video-generator',
  'subtitle-editor',
  'background-remover',
  'voiceover-generator',
  'image-generator',
  'video-translator',
  'mp4-to-gif',
  'multi-publisher',
]);
