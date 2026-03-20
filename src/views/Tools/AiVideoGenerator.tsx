'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { useLocaleStore } from '@/stores/useLocaleStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const GRADIENT: [string, string] = ['#8b5cf6', '#ec4899'];

type VisualStyleId = 'kinetic' | 'gradient-waves' | 'particle-field' | 'minimal-clean' | 'neon-glow';
type AspectRatio = '16:9' | '9:16' | '1:1';
type TransitionType = 'cut' | 'fade' | 'slide';
type DurationMode = 'auto' | 'fixed';

interface VisualStyleDef {
  id: VisualStyleId;
  label: string;
  desc: string;
  color: string;
}

const VISUAL_STYLES: VisualStyleDef[] = [
  { id: 'kinetic', label: 'Kinetic Typography', desc: 'Words animate in one at a time', color: '#f59e0b' },
  { id: 'gradient-waves', label: 'Gradient Waves', desc: 'Animated gradient background', color: '#3b82f6' },
  { id: 'particle-field', label: 'Particle Field', desc: 'Floating particles with text', color: '#10b981' },
  { id: 'minimal-clean', label: 'Minimal Clean', desc: 'White bg, elegant slides', color: '#6b7280' },
  { id: 'neon-glow', label: 'Neon Glow', desc: 'Dark bg with neon text', color: '#ec4899' },
];

const ASPECT_RATIOS: { id: AspectRatio; label: string; w: number; h: number }[] = [
  { id: '16:9', label: '16:9 (Landscape)', w: 1920, h: 1080 },
  { id: '9:16', label: '9:16 (Vertical)', w: 1080, h: 1920 },
  { id: '1:1', label: '1:1 (Square)', w: 1080, h: 1080 },
];

const TRANSITIONS: { id: TransitionType; label: string }[] = [
  { id: 'cut', label: 'Cut' },
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface Scene {
  id: string;
  text: string;
  style: VisualStyleId;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Canvas Drawing Helpers
   ═══════════════════════════════════════════════════════════════════════════ */

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  _lineHeight: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Per-Style Draw Functions
   ═══════════════════════════════════════════════════════════════════════════ */

function drawKineticTypography(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text: string, progress: number, fontSize: number, frameCount: number,
) {
  // Dark background
  ctx.fillStyle = '#0f0f1a';
  ctx.fillRect(0, 0, w, h);

  // Subtle animated grid lines
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.06)';
  ctx.lineWidth = 1;
  const offset = (frameCount * 0.5) % 60;
  for (let i = -1; i < w / 60 + 1; i++) {
    const x = i * 60 + offset;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let i = -1; i < h / 60 + 1; i++) {
    const y = i * 60 + offset;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Words animate in one at a time
  const words = text.split(/\s+/).filter(Boolean);
  const totalWords = words.length;
  const visibleCount = Math.floor(progress * totalWords);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const lineH = fontSize * 1.4;
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  const maxW = w * 0.8;

  // Build lines from visible words
  const visibleText = words.slice(0, visibleCount).join(' ');
  const lines = wrapText(ctx, visibleText || ' ', maxW, lineH);
  const totalH = lines.length * lineH;
  const startY = h / 2 - totalH / 2;

  lines.forEach((line, i) => {
    const y = startY + i * lineH + lineH / 2;
    const alpha = Math.min(1, (progress * totalWords - (visibleCount - lines.length + i)) * 0.3 + 0.7);
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.3, alpha)})`;
    ctx.fillText(line, w / 2, y);
  });

  // Active word scale effect
  if (visibleCount > 0 && visibleCount <= totalWords) {
    const activeWord = words[visibleCount - 1];
    const pulse = Math.sin(frameCount * 0.15) * 0.1 + 1.1;
    ctx.save();
    ctx.translate(w / 2, h / 2 + totalH / 2 + fontSize);
    ctx.scale(pulse, pulse);
    ctx.font = `bold ${fontSize * 1.2}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText(activeWord, 0, 0);
    ctx.restore();
  }

  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function drawGradientWaves(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text: string, progress: number, fontSize: number, frameCount: number,
) {
  const t = frameCount * 0.02;

  // Animated gradient background
  const grad = ctx.createLinearGradient(
    w * 0.5 + Math.sin(t) * w * 0.3, 0,
    w * 0.5 + Math.cos(t * 0.7) * w * 0.3, h,
  );
  grad.addColorStop(0, '#4f46e5');
  grad.addColorStop(0.3, '#7c3aed');
  grad.addColorStop(0.6, '#a855f7');
  grad.addColorStop(1, '#ec4899');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Wave overlay
  for (let wave = 0; wave < 3; wave++) {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 4) {
      const y = h * (0.6 + wave * 0.12)
        + Math.sin(x * 0.005 + t * (1 + wave * 0.3)) * 40
        + Math.cos(x * 0.003 + t * 0.5) * 20;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.03 + wave * 0.02})`;
    ctx.fill();
  }

  // Centered text with fade-in based on progress
  const alpha = Math.min(1, progress * 3);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  const lines = wrapText(ctx, text, w * 0.75, fontSize * 1.5);
  const lineH = fontSize * 1.5;
  const totalH = lines.length * lineH;
  const startY = h / 2 - totalH / 2;

  // Text shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;

  lines.forEach((line, i) => {
    const lineProgress = Math.max(0, Math.min(1, (progress * lines.length - i) * 1.5));
    const y = startY + i * lineH + lineH / 2;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * lineProgress})`;
    ctx.fillText(line, w / 2, y);
  });

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function drawParticleField(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text: string, progress: number, fontSize: number, frameCount: number,
) {
  // Dark background with subtle blue tint
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, w, h);

  // Particles
  const particleCount = 80;
  const t = frameCount * 0.01;
  for (let i = 0; i < particleCount; i++) {
    const seed = i * 137.508;
    const px = ((seed * 7.3 + t * 30 * ((i % 4) + 1)) % (w + 40)) - 20;
    const py = ((seed * 11.1 + t * 15 * ((i % 3) + 1)) % (h + 40)) - 20;
    const radius = 1 + (i % 4) * 1.2;
    const alpha = 0.15 + (Math.sin(t + i) * 0.1);

    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(139, 92, 246, ${alpha})`;
    ctx.fill();

    // Connection lines to nearby particles
    if (i < particleCount - 1) {
      const nextSeed = (i + 1) * 137.508;
      const nx = ((nextSeed * 7.3 + t * 30 * (((i + 1) % 4) + 1)) % (w + 40)) - 20;
      const ny = ((nextSeed * 11.1 + t * 15 * (((i + 1) % 3) + 1)) % (h + 40)) - 20;
      const dist = Math.hypot(nx - px, ny - py);
      if (dist < 150) {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(nx, ny);
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.04 * (1 - dist / 150)})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // Text overlay
  const alpha = Math.min(1, progress * 2.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  const lines = wrapText(ctx, text, w * 0.75, fontSize * 1.5);
  const lineH = fontSize * 1.5;
  const totalH = lines.length * lineH;
  const startY = h / 2 - totalH / 2;

  lines.forEach((line, i) => {
    const y = startY + i * lineH + lineH / 2;
    // Glow effect
    ctx.shadowColor = 'rgba(139, 92, 246, 0.6)';
    ctx.shadowBlur = 30;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.fillText(line, w / 2, y);
  });

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function drawMinimalClean(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text: string, progress: number, fontSize: number, _frameCount: number,
) {
  // Clean white background
  ctx.fillStyle = '#fafafa';
  ctx.fillRect(0, 0, w, h);

  // Subtle accent line at top
  const lineW = w * Math.min(1, progress * 1.5);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(0, 0, lineW, 4);

  // Elegant slide-in text
  const slideOffset = Math.max(0, (1 - Math.min(1, progress * 2)) * 60);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  const lines = wrapText(ctx, text, w * 0.7, fontSize * 1.6);
  const lineH = fontSize * 1.6;
  const totalH = lines.length * lineH;
  const startY = h / 2 - totalH / 2 + slideOffset;

  const alpha = Math.min(1, progress * 3);
  lines.forEach((line, i) => {
    const y = startY + i * lineH + lineH / 2;
    ctx.fillStyle = `rgba(26, 26, 26, ${alpha})`;
    ctx.fillText(line, w / 2, y);
  });

  // Minimal bottom accent dot
  if (progress > 0.5) {
    const dotAlpha = Math.min(1, (progress - 0.5) * 4);
    ctx.beginPath();
    ctx.arc(w / 2, h - 80, 6, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(26, 26, 26, ${dotAlpha * 0.3})`;
    ctx.fill();
  }

  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

function drawNeonGlow(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text: string, progress: number, fontSize: number, frameCount: number,
) {
  // Dark background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, w, h);

  const t = frameCount * 0.03;

  // Subtle animated neon border lines
  const borderGlow = Math.sin(t) * 0.3 + 0.7;
  ctx.strokeStyle = `rgba(236, 72, 153, ${0.15 * borderGlow})`;
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, w - 80, h - 80);

  ctx.strokeStyle = `rgba(139, 92, 246, ${0.1 * borderGlow})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(60, 60, w - 120, h - 120);

  // Neon text
  const alpha = Math.min(1, progress * 2.5);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  const lines = wrapText(ctx, text, w * 0.7, fontSize * 1.5);
  const lineH = fontSize * 1.5;
  const totalH = lines.length * lineH;
  const startY = h / 2 - totalH / 2;

  // Multi-layer glow
  const glowPulse = Math.sin(t * 1.5) * 0.2 + 0.8;

  lines.forEach((line, i) => {
    const y = startY + i * lineH + lineH / 2;

    // Outer glow
    ctx.shadowColor = `rgba(236, 72, 153, ${0.8 * glowPulse})`;
    ctx.shadowBlur = 40;
    ctx.fillStyle = `rgba(236, 72, 153, ${alpha * 0.15})`;
    ctx.fillText(line, w / 2, y);

    // Inner glow
    ctx.shadowColor = `rgba(236, 72, 153, ${0.6 * glowPulse})`;
    ctx.shadowBlur = 15;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
    ctx.fillText(line, w / 2, y);
  });

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.textAlign = 'start';
  ctx.textBaseline = 'alphabetic';
}

const STYLE_DRAWERS: Record<VisualStyleId, typeof drawKineticTypography> = {
  'kinetic': drawKineticTypography,
  'gradient-waves': drawGradientWaves,
  'particle-field': drawParticleField,
  'minimal-clean': drawMinimalClean,
  'neon-glow': drawNeonGlow,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Scene Parsing
   ═══════════════════════════════════════════════════════════════════════════ */

let idCounter = 0;
function uid(): string {
  return `scene-${++idCounter}-${Date.now()}`;
}

function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by a space or end-of-string
  const raw = text.match(/[^.!?]*[.!?]+[\s]?|[^.!?]+$/g);
  if (!raw) return [text];
  return raw.map((s) => s.trim()).filter(Boolean);
}

function groupSentencesIntoScenes(sentences: string[], targetScenes: number): string[] {
  if (sentences.length <= targetScenes) {
    return sentences;
  }
  const perScene = Math.ceil(sentences.length / targetScenes);
  const groups: string[] = [];
  for (let i = 0; i < sentences.length; i += perScene) {
    groups.push(sentences.slice(i, i + perScene).join(' '));
  }
  return groups;
}

function parseScenes(raw: string): Scene[] {
  const blocks = raw
    .split(/(?:\n\s*\n|\n---\n)/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (blocks.length === 0) return [];

  // If there are already multiple blocks the user separated manually, use them
  if (blocks.length > 1) {
    return blocks.map((text, i) => ({
      id: uid(),
      text,
      style: VISUAL_STYLES[i % VISUAL_STYLES.length].id,
    }));
  }

  // Single block — try to auto-split into 4-6 scenes by sentences
  const singleText = blocks[0];
  const sentences = splitIntoSentences(singleText);

  if (sentences.length >= 2) {
    // Group sentences into ~5 scenes (clamp between 4-6)
    const target = Math.max(4, Math.min(6, sentences.length));
    const groups = groupSentencesIntoScenes(sentences, target);
    return groups.map((text, i) => ({
      id: uid(),
      text,
      style: VISUAL_STYLES[i % VISUAL_STYLES.length].id,
    }));
  }

  // Very short text (single sentence or fragment) — wrap into 1 scene
  return [{ id: uid(), text: singleText, style: VISUAL_STYLES[0].id }];
}

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function AiVideoGenerator() {
  const C = useThemeStore((s) => s.theme);
  const isDark = useThemeStore((s) => s.isDark);
  const t = useLocaleStore((s) => s.t);

  /* ── Script & scenes state ── */
  const [rawScript, setRawScript] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);

  /* ── Global settings ── */
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [fontSize, setFontSize] = useState(42);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [durationMode, setDurationMode] = useState<DurationMode>('auto');
  const [fixedDuration, setFixedDuration] = useState(5);
  const [transitionType, setTransitionType] = useState<TransitionType>('fade');

  /* ── Preview / Export state ── */
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  /* ── Hover states ── */
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);

  /* ── Refs ── */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRafRef = useRef(0);
  const abortRef = useRef(false);

  /* ── Load browser TTS voices ── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    function load() {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      const english = voices.filter((v) => v.lang.startsWith('en'));
      setAvailableVoices(english.length > 0 ? english : voices);
    }
    load();
    window.speechSynthesis?.addEventListener('voiceschanged', load);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', load);
    };
  }, []);

  /* ── Browser support check ── */
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasCanvas = !!document.createElement('canvas').getContext('2d');
    const hasMediaRecorder = typeof MediaRecorder !== 'undefined';
    const hasSpeech = 'speechSynthesis' in window;
    if (!hasCanvas || !hasMediaRecorder || !hasSpeech) {
      setSupported(false);
    }
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
     Scene Management
     ══════════════════════════════════════════════════════════════════════ */

  const handleParseScenes = useCallback(() => {
    const parsed = parseScenes(rawScript);
    if (parsed.length === 0) {
      setError('Enter some text to generate scenes. Separate scenes with blank lines or "---".');
      return;
    }
    setScenes(parsed);
    setActiveSceneIdx(0);
    setError('');
    setVideoUrl(null);
  }, [rawScript]);

  const updateSceneText = useCallback((idx: number, text: string) => {
    setScenes((prev) => prev.map((s, i) => (i === idx ? { ...s, text } : s)));
  }, []);

  const updateSceneStyle = useCallback((idx: number, style: VisualStyleId) => {
    setScenes((prev) => prev.map((s, i) => (i === idx ? { ...s, style } : s)));
  }, []);

  const moveScene = useCallback((idx: number, dir: -1 | 1) => {
    setScenes((prev) => {
      const next = [...prev];
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= next.length) return prev;
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next;
    });
    setActiveSceneIdx((prev) => {
      const target = prev + dir;
      if (target < 0 || target >= scenes.length) return prev;
      return target;
    });
  }, [scenes.length]);

  const removeScene = useCallback((idx: number) => {
    setScenes((prev) => prev.filter((_, i) => i !== idx));
    setActiveSceneIdx((prev) => Math.min(prev, Math.max(0, scenes.length - 2)));
  }, [scenes.length]);

  const addScene = useCallback(() => {
    setScenes((prev) => [...prev, { id: uid(), text: 'New scene', style: 'gradient-waves' }]);
  }, []);

  /* ══════════════════════════════════════════════════════════════════════
     Canvas Dimensions
     ══════════════════════════════════════════════════════════════════════ */

  const getDimensions = useCallback((): { w: number; h: number } => {
    const ratio = ASPECT_RATIOS.find((r) => r.id === aspectRatio) ?? ASPECT_RATIOS[0];
    return { w: ratio.w, h: ratio.h };
  }, [aspectRatio]);

  /* ══════════════════════════════════════════════════════════════════════
     Compute scene durations
     ══════════════════════════════════════════════════════════════════════ */

  const INTRO_BUFFER = 1.5; // seconds of fade-in before first scene
  const OUTRO_BUFFER = 2.5; // seconds of outro after last narration ends

  const computeDurations = useCallback((): { durations: number[]; total: number } => {
    const durations: number[] = [];
    let total = INTRO_BUFFER; // start with intro buffer
    for (const scene of scenes) {
      if (durationMode === 'fixed') {
        durations.push(fixedDuration);
        total += fixedDuration;
      } else {
        const wordCount = scene.text.split(/\s+/).filter(Boolean).length;
        // Add 20% safety margin so speech finishes before scene ends
        const dur = Math.max(2, ((wordCount / (150 / 60)) / speechRate) * 1.2);
        durations.push(dur);
        total += dur;
      }
    }
    total += OUTRO_BUFFER; // add outro buffer
    return { durations, total };
  }, [scenes, durationMode, fixedDuration, speechRate]);

  /* ══════════════════════════════════════════════════════════════════════
     Core rendering loop (shared by preview and export)
     ══════════════════════════════════════════════════════════════════════ */

  function renderFrame(
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    elapsed: number,
    frame: number,
    sceneDurations: number[],
    sceneList: Scene[],
    transition: TransitionType,
    fSize: number,
    introBuffer: number,
  ) {
    // ── Intro phase: fade-in title card ──
    if (elapsed < introBuffer) {
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, w, h);
      const alpha = Math.min(1, elapsed / Math.min(0.6, introBuffer));
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Math.round(fSize * 1.3)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
      // Use first scene text as title, truncated
      const titleText = sceneList.length > 0
        ? (sceneList[0].text.length > 60 ? sceneList[0].text.slice(0, 57) + '...' : sceneList[0].text)
        : '';
      const titleLines = wrapText(ctx, titleText, w * 0.75, fSize * 1.6);
      const titleLineH = fSize * 1.6;
      const titleStartY = h / 2 - (titleLines.length * titleLineH) / 2;
      titleLines.forEach((line, i) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
        ctx.fillText(line, w / 2, titleStartY + i * titleLineH + titleLineH / 2);
      });
      ctx.textAlign = 'start';
      ctx.textBaseline = 'alphabetic';
      return -1;
    }

    // ── Scene phase: adjust elapsed to remove intro buffer ──
    const sceneElapsed = elapsed - introBuffer;

    const transitionDur = 0.4;
    let cumTime = 0;
    let sceneIdx = 0;
    let sceneLocalTime = 0;
    for (let i = 0; i < sceneList.length; i++) {
      if (sceneElapsed < cumTime + sceneDurations[i]) {
        sceneIdx = i;
        sceneLocalTime = sceneElapsed - cumTime;
        break;
      }
      cumTime += sceneDurations[i];
      if (i === sceneList.length - 1) {
        sceneIdx = sceneList.length - 1;
        sceneLocalTime = sceneDurations[i];
      }
    }

    const sceneDur = sceneDurations[sceneIdx];
    const sceneProgress = Math.min(1, sceneLocalTime / sceneDur);
    const scene = sceneList[sceneIdx];
    const drawer = STYLE_DRAWERS[scene.style];

    const inTrans = sceneLocalTime < transitionDur && sceneIdx > 0 && transition !== 'cut';
    const outTrans = sceneLocalTime > sceneDur - transitionDur && sceneIdx < sceneList.length - 1 && transition !== 'cut';

    if (transition === 'slide' && inTrans) {
      const tp = sceneLocalTime / transitionDur;
      ctx.save();
      ctx.translate((1 - tp) * w, 0);
    }

    drawer(ctx, w, h, scene.text, sceneProgress, fSize, frame);

    if (transition === 'slide' && inTrans) {
      ctx.restore();
    }

    if (transition === 'fade') {
      if (inTrans) {
        const tp = sceneLocalTime / transitionDur;
        ctx.fillStyle = `rgba(0, 0, 0, ${1 - tp})`;
        ctx.fillRect(0, 0, w, h);
      }
      if (outTrans) {
        const tp = (sceneLocalTime - (sceneDur - transitionDur)) / transitionDur;
        ctx.fillStyle = `rgba(0, 0, 0, ${tp})`;
        ctx.fillRect(0, 0, w, h);
      }
    }

    // Scene indicator dots
    sceneList.forEach((_, i) => {
      const dotX = w / 2 - (sceneList.length * 12) / 2 + i * 12 + 4;
      ctx.beginPath();
      ctx.arc(dotX, h - 30, i === sceneIdx ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i === sceneIdx ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)';
      ctx.fill();
    });

    return sceneIdx;
  }

  /* ══════════════════════════════════════════════════════════════════════
     Preview on Canvas
     ══════════════════════════════════════════════════════════════════════ */

  const handlePreview = useCallback(() => {
    if (scenes.length === 0) return;
    if (isPreviewing) {
      cancelAnimationFrame(previewRafRef.current);
      window.speechSynthesis?.cancel();
      setIsPreviewing(false);
      return;
    }

    setIsPreviewing(true);
    setError('');
    const { w, h } = getDimensions();
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { durations, total } = computeDurations();

    // TTS for each scene sequentially — start after intro buffer
    let allSpeechDone = false;
    let currentSceneSpeaking = 0;
    function speakScene(idx: number) {
      if (idx >= scenes.length) { allSpeechDone = true; return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(scenes[idx].text);
      const voice = availableVoices[selectedVoiceIdx];
      if (voice) utterance.voice = voice;
      utterance.rate = speechRate;
      utterance.onend = () => {
        currentSceneSpeaking = idx + 1;
        if (currentSceneSpeaking < scenes.length) {
          speakScene(currentSceneSpeaking);
        } else {
          allSpeechDone = true;
        }
      };
      window.speechSynthesis.speak(utterance);
    }

    const startTime = performance.now();
    let frame = 0;
    let speechStarted = false;

    function drawLoop() {
      const elapsed = (performance.now() - startTime) / 1000;
      frame++;

      // Start speech after intro buffer
      if (!speechStarted && elapsed >= INTRO_BUFFER) {
        speechStarted = true;
        speakScene(0);
      }

      renderFrame(ctx!, w, h, elapsed, frame, durations, scenes, transitionType, fontSize, INTRO_BUFFER);

      // Keep rendering until both the calculated total time has elapsed AND speech is done
      const timeUp = elapsed >= total;
      if (!timeUp || (!allSpeechDone && !timeUp)) {
        previewRafRef.current = requestAnimationFrame(drawLoop);
      } else {
        window.speechSynthesis?.cancel();
        setIsPreviewing(false);
      }
    }

    previewRafRef.current = requestAnimationFrame(drawLoop);
  }, [scenes, isPreviewing, getDimensions, computeDurations, availableVoices, selectedVoiceIdx, speechRate, transitionType, fontSize]);

  /* ══════════════════════════════════════════════════════════════════════
     Export to WebM
     ══════════════════════════════════════════════════════════════════════ */

  const handleExport = useCallback(async () => {
    if (scenes.length === 0 || isExporting) return;
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Initializing...');
    setError('');
    setVideoUrl(null);
    abortRef.current = false;

    try {
      const { w, h } = getDimensions();
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;

      const { durations, total } = computeDurations();

      setExportStatus('Setting up recorder...');
      setExportProgress(5);

      // MediaRecorder from canvas stream
      const stream = canvas.captureStream(30);

      let audioCtx: AudioContext | null = null;
      try {
        audioCtx = new AudioContext();
        const audioDestination = audioCtx.createMediaStreamDestination();
        audioDestination.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch {
        // silent video fallback
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 5_000_000 });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };
      });

      recorder.start(100);

      // TTS — start after intro buffer, track when all speech completes
      setExportStatus('Rendering scenes with narration...');
      setExportProgress(10);

      let allSpeechDone = false;
      let currentSceneSpeaking = 0;
      function speakScene(idx: number) {
        if (idx >= scenes.length) { allSpeechDone = true; return; }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(scenes[idx].text);
        const voice = availableVoices[selectedVoiceIdx];
        if (voice) utterance.voice = voice;
        utterance.rate = speechRate;
        utterance.onend = () => {
          currentSceneSpeaking = idx + 1;
          if (currentSceneSpeaking < scenes.length) {
            speakScene(currentSceneSpeaking);
          } else {
            allSpeechDone = true;
          }
        };
        window.speechSynthesis.speak(utterance);
      }

      // Render loop
      const startTime = performance.now();
      let frame = 0;
      let speechStarted = false;

      await new Promise<void>((resolve) => {
        function draw() {
          if (abortRef.current) { resolve(); return; }
          const elapsed = (performance.now() - startTime) / 1000;
          frame++;

          // Start speech after intro buffer
          if (!speechStarted && elapsed >= INTRO_BUFFER) {
            speechStarted = true;
            speakScene(0);
          }

          const sceneIdx = renderFrame(ctx, w, h, elapsed, frame, durations, scenes, transitionType, fontSize, INTRO_BUFFER);

          const p = 10 + (elapsed / total) * 80;
          setExportProgress(Math.min(90, p));
          if (sceneIdx >= 0) {
            setExportStatus(`Rendering scene ${sceneIdx + 1} of ${scenes.length}...`);
          } else {
            setExportStatus('Intro...');
          }

          // Keep rendering until calculated time is up AND speech has finished
          const timeUp = elapsed >= total;
          if (!abortRef.current && (!timeUp || !allSpeechDone)) {
            requestAnimationFrame(draw);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(draw);
      });

      if (abortRef.current) {
        recorder.stop();
        window.speechSynthesis?.cancel();
        return;
      }

      // Wait a moment for any remaining speech to fully finish
      window.speechSynthesis?.cancel();

      // Outro frame for 2.5 seconds
      setExportStatus('Adding outro...');
      setExportProgress(92);
      const outroStart = performance.now();
      await new Promise<void>((resolve) => {
        function outroFrame() {
          const ot = (performance.now() - outroStart) / 1000;
          ctx.fillStyle = '#0a0a1a';
          ctx.fillRect(0, 0, w, h);
          const alpha = Math.min(1, ot / 0.5);
          // Fade out near the end
          const fadeOut = ot > 1.8 ? Math.max(0, 1 - (ot - 1.8) / 0.7) : 1;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.font = `bold ${Math.round(fontSize * 1.2)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * fadeOut * 0.9})`;
          ctx.fillText('Thanks for watching!', w / 2, h / 2);
          ctx.font = `${Math.round(fontSize * 0.6)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * fadeOut * 0.4})`;
          ctx.fillText('Made with TubeForge', w / 2, h / 2 + fontSize);
          ctx.textAlign = 'start';
          ctx.textBaseline = 'alphabetic';

          if (ot < OUTRO_BUFFER) {
            requestAnimationFrame(outroFrame);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(outroFrame);
      });

      // Stop recording and encode
      setExportStatus('Encoding video...');
      setExportProgress(95);
      recorder.stop();
      const videoBlob = await recordingDone;

      if (audioCtx) {
        try { await audioCtx.close(); } catch { /* ignore */ }
      }

      if (abortRef.current) return;

      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setExportProgress(100);
      setExportStatus('Done!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Export failed';
      setError(msg);
      setExportStatus('');
      window.speechSynthesis?.cancel();
    } finally {
      setIsExporting(false);
    }
  }, [scenes, isExporting, getDimensions, computeDurations, availableVoices, selectedVoiceIdx, speechRate, transitionType, fontSize]);

  /* ── Download ── */
  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `tubeforge-video-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [videoUrl]);

  /* ── Cancel ── */
  const handleCancelExport = useCallback(() => {
    abortRef.current = true;
    window.speechSynthesis?.cancel();
    cancelAnimationFrame(previewRafRef.current);
    setIsExporting(false);
    setIsPreviewing(false);
    setExportStatus('Cancelled');
  }, []);

  /* ── Cleanup on unmount ── */
  useEffect(() => {
    return () => {
      cancelAnimationFrame(previewRafRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════════ */

  const arDef = ASPECT_RATIOS.find((r) => r.id === aspectRatio) ?? ASPECT_RATIOS[0];
  const previewAspect = `${arDef.w}/${arDef.h}`;

  return (
    <ToolPageShell
      title="AI Video Generator"
      subtitle="Create stunning text-to-video content with animated scenes, narration, and transitions"
      gradient={GRADIENT}
    >
      {/* Browser support warning */}
      {!supported && (
        <div style={{
          padding: '14px 16px', borderRadius: 12, marginBottom: 20,
          background: `${C.red}12`, border: `1px solid ${C.red}30`,
          color: C.red, fontSize: 13, fontWeight: 500,
          wordBreak: 'break-word',
        }}>
          Your browser does not support one or more required APIs (Canvas, MediaRecorder, SpeechSynthesis).
          Please use a modern Chromium-based browser for full functionality.
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: 24,
      }}>
        {/* ──── Left Column: Script + Scene Editor + Settings ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Script Input ── */}
          <div style={{
            padding: 16, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                Video Script
              </span>
              <span style={{ fontSize: 11, color: C.dim }}>
                Separate scenes with blank lines or &quot;---&quot;
              </span>
            </div>
            <textarea
              value={rawScript}
              onChange={(e) => setRawScript(e.target.value)}
              placeholder={`Welcome to our channel!\n\n---\n\nToday we're going to explore something amazing.\n\n---\n\nDon't forget to like and subscribe!`}
              rows={8}
              style={{
                width: '100%', padding: 14, borderRadius: 12,
                border: `1px solid ${C.border}`, background: C.surface,
                color: C.text, fontSize: 14, fontFamily: 'inherit',
                resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s ease',
                lineHeight: 1.6,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.dim }}>
                {rawScript.length} characters
              </span>
              <ActionButton
                label="Generate Scenes"
                gradient={GRADIENT}
                onClick={handleParseScenes}
                disabled={!rawScript.trim()}
              />
            </div>
          </div>

          {/* ── Scene Editor ── */}
          {scenes.length > 0 && (
            <div style={{
              padding: 16, borderRadius: 16,
              border: `1px solid ${C.border}`, background: C.card,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                  Scenes ({scenes.length})
                </span>
                <button
                  onClick={addScene}
                  style={{
                    padding: '6px 14px', borderRadius: 8, minHeight: 44,
                    border: `1px solid ${C.border}`, background: C.surface,
                    color: C.text, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; }}
                >
                  + Add Scene
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 500, overflowY: 'auto' }}>
                {scenes.map((scene, idx) => {
                  const isActive = idx === activeSceneIdx;
                  const styleDef = VISUAL_STYLES.find((s) => s.id === scene.style) ?? VISUAL_STYLES[0];
                  return (
                    <div
                      key={scene.id}
                      onClick={() => setActiveSceneIdx(idx)}
                      style={{
                        padding: 14, borderRadius: 12,
                        border: `1px solid ${isActive ? GRADIENT[0] : C.border}`,
                        background: isActive ? `${GRADIENT[0]}08` : C.surface,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Scene header */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isActive ? 10 : 0, flexWrap: 'wrap' }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 6,
                          background: `linear-gradient(135deg, ${styleDef.color}, ${styleDef.color}aa)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
                        }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text, flex: 1, minWidth: 0, wordBreak: 'break-word', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isActive ? 'normal' : 'nowrap' }}>
                          {isActive ? `Scene ${idx + 1}` : scene.text}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, color: styleDef.color,
                          padding: '2px 8px', borderRadius: 6,
                          background: `${styleDef.color}15`, whiteSpace: 'nowrap', flexShrink: 0,
                        }}>
                          {styleDef.label}
                        </span>

                        {/* Move / Remove buttons */}
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveScene(idx, -1); }}
                            disabled={idx === 0}
                            aria-label="Move scene up"
                            style={{
                              width: 22, height: 22, borderRadius: 4,
                              border: `1px solid ${C.border}`, background: C.card,
                              color: idx === 0 ? C.dim : C.text, cursor: idx === 0 ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontFamily: 'inherit', transition: 'all 0.15s ease',
                              opacity: idx === 0 ? 0.4 : 1,
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                              <polyline points="18 15 12 9 6 15" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveScene(idx, 1); }}
                            disabled={idx === scenes.length - 1}
                            aria-label="Move scene down"
                            style={{
                              width: 22, height: 22, borderRadius: 4,
                              border: `1px solid ${C.border}`, background: C.card,
                              color: idx === scenes.length - 1 ? C.dim : C.text,
                              cursor: idx === scenes.length - 1 ? 'default' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontFamily: 'inherit', transition: 'all 0.15s ease',
                              opacity: idx === scenes.length - 1 ? 0.4 : 1,
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </button>
                          {scenes.length > 1 && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeScene(idx); }}
                              aria-label="Remove scene"
                              style={{
                                width: 22, height: 22, borderRadius: 4,
                                border: `1px solid ${C.border}`, background: C.card,
                                color: C.red, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, fontFamily: 'inherit', transition: 'all 0.15s ease',
                              }}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Scene text editor (expanded when active) */}
                      {isActive && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <textarea
                            value={scene.text}
                            onChange={(e) => updateSceneText(idx, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            rows={3}
                            style={{
                              width: '100%', padding: 10, borderRadius: 8,
                              border: `1px solid ${C.border}`, background: C.card,
                              color: C.text, fontSize: 13, fontFamily: 'inherit',
                              resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                              transition: 'border-color 0.2s ease',
                            }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                          />

                          {/* Visual style selector */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {VISUAL_STYLES.map((vs) => {
                              const isSel = scene.style === vs.id;
                              const isHov = hoveredStyle === `${idx}-${vs.id}`;
                              return (
                                <button
                                  key={vs.id}
                                  onClick={(e) => { e.stopPropagation(); updateSceneStyle(idx, vs.id); }}
                                  onMouseEnter={() => setHoveredStyle(`${idx}-${vs.id}`)}
                                  onMouseLeave={() => setHoveredStyle(null)}
                                  style={{
                                    padding: '5px 10px', borderRadius: 6,
                                    border: `1px solid ${isSel ? vs.color : isHov ? `${vs.color}66` : C.border}`,
                                    background: isSel ? `${vs.color}18` : 'transparent',
                                    color: isSel ? vs.color : C.sub,
                                    fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                    fontFamily: 'inherit', transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {vs.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Global Settings ── */}
          <div style={{
            padding: 16, borderRadius: 16,
            border: `1px solid ${C.border}`, background: C.card,
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.text, display: 'block', marginBottom: 16 }}>
              Settings
            </span>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Voice selector */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 6 }}>
                  Voice ({availableVoices.length} available)
                </label>
                {availableVoices.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select
                      value={selectedVoiceIdx}
                      onChange={(e) => setSelectedVoiceIdx(Number(e.target.value))}
                      style={{
                        flex: '1 1 200px', padding: '10px 12px', borderRadius: 10,
                        border: `1px solid ${C.border}`, background: C.surface,
                        color: C.text, fontSize: 13, fontFamily: 'inherit',
                        outline: 'none', cursor: 'pointer', minHeight: 44,
                        transition: 'border-color 0.2s ease',
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                    >
                      {availableVoices.map((v, i) => (
                        <option key={`${v.name}-${v.lang}`} value={i}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        window.speechSynthesis.cancel();
                        const u = new SpeechSynthesisUtterance('This is a preview of the selected voice.');
                        const voice = availableVoices[selectedVoiceIdx];
                        if (voice) u.voice = voice;
                        u.rate = speechRate;
                        window.speechSynthesis.speak(u);
                      }}
                      style={{
                        padding: '10px 14px', borderRadius: 10, minHeight: 44,
                        border: `1px solid ${C.border}`, background: C.surface,
                        color: C.text, fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.2s ease', whiteSpace: 'nowrap',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = C.surface; }}
                    >
                      Test
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: 12, color: C.dim, margin: 0 }}>
                    No speech voices found. Video will be exported without narration.
                  </p>
                )}
              </div>

              {/* Speech rate */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Speech Rate</label>
                  <span style={{ fontSize: 12, color: GRADIENT[0], fontWeight: 700 }}>{speechRate.toFixed(1)}x</span>
                </div>
                <input
                  type="range" min={0.5} max={2} step={0.1} value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  aria-label="Speech rate"
                  style={{ width: '100%', accentColor: GRADIENT[0], cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.dim, marginTop: 2 }}>
                  <span>0.5x</span><span>1.0x</span><span>1.5x</span><span>2.0x</span>
                </div>
              </div>

              {/* Font size */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.sub }}>Font Size</label>
                  <span style={{ fontSize: 12, color: GRADIENT[0], fontWeight: 700 }}>{fontSize}px</span>
                </div>
                <input
                  type="range" min={24} max={72} step={2} value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  aria-label="Font size"
                  style={{ width: '100%', accentColor: GRADIENT[0], cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: C.dim, marginTop: 2 }}>
                  <span>24</span><span>48</span><span>72</span>
                </div>
              </div>

              {/* Aspect ratio */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 6 }}>
                  Aspect Ratio
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ASPECT_RATIOS.map((ar) => {
                    const isSel = aspectRatio === ar.id;
                    return (
                      <button
                        key={ar.id}
                        onClick={() => setAspectRatio(ar.id)}
                        style={{
                          flex: '1 1 80px', padding: '8px 4px', borderRadius: 8, minHeight: 44,
                          border: `1px solid ${isSel ? GRADIENT[0] : C.border}`,
                          background: isSel ? `${GRADIENT[0]}12` : C.surface,
                          color: isSel ? GRADIENT[0] : C.sub,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        {ar.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Duration mode */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 6 }}>
                  Scene Duration
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['auto', 'fixed'] as const).map((mode) => {
                    const isSel = durationMode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setDurationMode(mode)}
                        style={{
                          flex: '1 1 100px', padding: '8px 4px', borderRadius: 8, minHeight: 44,
                          border: `1px solid ${isSel ? GRADIENT[0] : C.border}`,
                          background: isSel ? `${GRADIENT[0]}12` : C.surface,
                          color: isSel ? GRADIENT[0] : C.sub,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        {mode === 'auto' ? 'Auto (match speech)' : 'Fixed'}
                      </button>
                    );
                  })}
                </div>
                {durationMode === 'fixed' && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: C.dim }}>Seconds per scene</span>
                      <span style={{ fontSize: 11, color: GRADIENT[0], fontWeight: 700 }}>{fixedDuration}s</span>
                    </div>
                    <input
                      type="range" min={2} max={15} step={1} value={fixedDuration}
                      onChange={(e) => setFixedDuration(Number(e.target.value))}
                      aria-label="Fixed duration per scene"
                      style={{ width: '100%', accentColor: GRADIENT[0], cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>

              {/* Transition type */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 6 }}>
                  Transition
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TRANSITIONS.map((tr) => {
                    const isSel = transitionType === tr.id;
                    return (
                      <button
                        key={tr.id}
                        onClick={() => setTransitionType(tr.id)}
                        style={{
                          flex: '1 1 60px', padding: '8px 4px', borderRadius: 8, minHeight: 44,
                          border: `1px solid ${isSel ? GRADIENT[0] : C.border}`,
                          background: isSel ? `${GRADIENT[0]}12` : C.surface,
                          color: isSel ? GRADIENT[0] : C.sub,
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          fontFamily: 'inherit', transition: 'all 0.15s ease',
                          textAlign: 'center',
                        }}
                      >
                        {tr.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Resolution badge */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: C.surface, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 8,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Output Resolution</span>
            <span style={{
              padding: '4px 12px', borderRadius: 8,
              background: `${GRADIENT[0]}18`, color: GRADIENT[0],
              fontSize: 12, fontWeight: 700,
            }}>
              {arDef.w}x{arDef.h}
            </span>
          </div>
        </div>

        {/* ──── Right Column: Preview + Export ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
              Preview & Export
            </h3>
            {scenes.length > 0 && (
              <span style={{ fontSize: 11, color: C.dim }}>
                {scenes.length} scene{scenes.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Visual style legend */}
          {scenes.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {VISUAL_STYLES.map((vs) => {
                const count = scenes.filter((s) => s.style === vs.id).length;
                if (count === 0) return null;
                return (
                  <span key={vs.id} style={{
                    padding: '3px 10px', borderRadius: 6,
                    background: `${vs.color}12`, color: vs.color,
                    fontSize: 10, fontWeight: 700,
                  }}>
                    {vs.label} ({count})
                  </span>
                );
              })}
            </div>
          )}

          {/* Export progress bar */}
          {(isExporting || exportProgress > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                width: '100%', height: 8, borderRadius: 4,
                background: C.surface, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                  width: `${exportProgress}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 500, wordBreak: 'break-word', minWidth: 0 }}>
                  {exportStatus}
                </span>
                <span style={{ fontSize: 12, color: C.dim, fontWeight: 600 }}>
                  {Math.round(exportProgress)}%
                </span>
              </div>
            </div>
          )}

          {/* Canvas / Video preview */}
          {videoUrl ? (
            <div style={{
              width: '100%', borderRadius: 14,
              border: `1px solid ${C.border}`, overflow: 'hidden',
              background: '#000',
            }}>
              <video
                src={videoUrl}
                controls
                playsInline
                style={{ width: '100%', display: 'block', maxHeight: 600 }}
              />
            </div>
          ) : (
            <div style={{
              width: '100%', borderRadius: 14,
              border: `1px solid ${C.border}`,
              background: isDark ? '#0a0a1a' : '#f0f0f0',
              overflow: 'hidden',
              position: 'relative',
            }}>
              <canvas
                ref={canvasRef}
                style={{
                  width: '100%',
                  maxWidth: arDef.w,
                  aspectRatio: previewAspect,
                  display: 'block',
                  maxHeight: 600,
                }}
              />
              {/* Empty state */}
              {!isPreviewing && scenes.length === 0 && !isExporting && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12,
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.3}>
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  <p style={{ fontSize: 13, color: C.dim }}>
                    Enter a script and generate scenes to begin
                  </p>
                </div>
              )}
              {/* Play overlay */}
              {!isPreviewing && scenes.length > 0 && !isExporting && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12, background: 'rgba(0,0,0,0.3)',
                }}>
                  <button
                    onClick={handlePreview}
                    style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                      border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'transform 0.2s ease',
                      boxShadow: `0 4px 20px ${GRADIENT[0]}44`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                    aria-label="Play preview"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                      <polygon points="6 3 20 12 6 21 6 3" />
                    </svg>
                  </button>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                    Click to preview
                  </span>
                </div>
              )}
              {/* Stop preview button */}
              {isPreviewing && (
                <div style={{ position: 'absolute', top: 12, right: 12 }}>
                  <button
                    onClick={handlePreview}
                    style={{
                      padding: '6px 14px', borderRadius: 8, minHeight: 44,
                      background: 'rgba(0,0,0,0.6)', border: 'none',
                      color: '#fff', fontSize: 11, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'background 0.2s ease',
                      backdropFilter: 'blur(8px)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.8)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; }}
                  >
                    Stop Preview
                  </button>
                </div>
              )}
              {/* Exporting overlay */}
              {isExporting && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12, background: 'rgba(0,0,0,0.5)',
                  backdropFilter: 'blur(4px)',
                }}>
                  <svg width="32" height="32" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,0.2)" strokeWidth="2" fill="none" />
                    <path d="M8 2a6 6 0 014.47 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                  <span style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>
                    {exportStatus || 'Exporting...'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: `${C.red}12`, border: `1px solid ${C.red}30`,
              color: C.red, fontSize: 13, fontWeight: 500,
              wordBreak: 'break-word',
            }}>
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {scenes.length > 0 && !videoUrl && (
              <>
                <ActionButton
                  label={isPreviewing ? 'Previewing...' : 'Preview'}
                  gradient={GRADIENT}
                  onClick={handlePreview}
                  disabled={isExporting}
                />
                <ActionButton
                  label={isExporting ? 'Exporting...' : 'Generate & Download'}
                  gradient={['#10b981', '#059669']}
                  onClick={handleExport}
                  disabled={isPreviewing}
                  loading={isExporting}
                />
              </>
            )}
            {(isExporting || isPreviewing) && (
              <button
                onClick={handleCancelExport}
                style={{
                  padding: '12px 20px', borderRadius: 12, minHeight: 44,
                  border: `1px solid ${C.border}`, background: C.card,
                  color: C.text, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
              >
                Cancel
              </button>
            )}
          </div>

          {/* Download / New buttons after export */}
          {videoUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={handleDownload}
                style={{
                  padding: '14px 0', borderRadius: 12, minHeight: 44,
                  border: 'none',
                  background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: `0 4px 16px ${GRADIENT[0]}33`,
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 6px 20px ${GRADIENT[0]}44`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = `0 4px 16px ${GRADIENT[0]}33`;
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Video (.webm)
              </button>
              <button
                onClick={() => {
                  if (videoUrl) URL.revokeObjectURL(videoUrl);
                  setVideoUrl(null);
                  setExportProgress(0);
                  setExportStatus('');
                  setError('');
                }}
                style={{
                  padding: '10px 0', borderRadius: 12, minHeight: 44,
                  border: `1px solid ${C.border}`,
                  background: 'transparent', color: C.sub,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s ease',
                  width: '100%',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = C.text; e.currentTarget.style.background = C.surface; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = C.sub; e.currentTarget.style.background = 'transparent'; }}
              >
                Create New Video
              </button>
            </div>
          )}

          {/* How it works info card */}
          <div style={{
            padding: 16, borderRadius: 12,
            background: `${GRADIENT[0]}08`,
            border: `1px solid ${GRADIENT[0]}20`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, wordBreak: 'break-word' }}>
              How it works
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                'Write your video script in the text area',
                'Click "Generate Scenes" to split into animated scenes',
                'Customize visual style, text, and order for each scene',
                'Adjust voice, speed, aspect ratio, and transitions',
                'Preview your video, then export as WebM',
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                    color: '#fff', fontSize: 10, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 12, color: C.sub, lineHeight: 1.4, wordBreak: 'break-word', minWidth: 0 }}>
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Client-side info card */}
          <div style={{
            padding: 14, borderRadius: 12,
            background: `${C.green}10`,
            border: `1px solid ${C.green}25`,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1.4 }}>
                100% Client-Side
              </span>
              <span style={{ fontSize: 11, color: C.sub, lineHeight: 1.5, wordBreak: 'break-word' }}>
                {t('tools.videoGenClientSideInfo')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Spin keyframe for loading spinners */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </ToolPageShell>
  );
}
