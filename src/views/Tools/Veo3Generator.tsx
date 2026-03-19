'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import { trpc } from '@/lib/trpc';

/* ── Constants ──────────────────────────────────────────── */

const GRADIENT: [string, string] = ['#ef4444', '#f97316'];
const DURATIONS = ['5s', '10s', '15s', '30s'] as const;
const ASPECTS = ['16:9', '9:16', '1:1'] as const;
const MAX_PROMPT_LENGTH = 500;

const ASPECT_SIZES: Record<string, [number, number]> = {
  '16:9': [1280, 720],
  '9:16': [720, 1280],
  '1:1': [720, 720],
};

type StylePresetId = 'cinematic' | 'animation' | 'documentary' | 'musicvideo';

const STYLE_PRESETS: readonly { id: StylePresetId; name: string; desc: string; icon: string; color: string }[] = [
  { id: 'cinematic', name: 'Cinematic', desc: 'Film-quality visuals', icon: 'C', color: '#ef4444' },
  { id: 'animation', name: 'Animation', desc: '2D/3D animated style', icon: 'A', color: '#8b5cf6' },
  { id: 'documentary', name: 'Documentary', desc: 'Realistic footage', icon: 'D', color: '#10b981' },
  { id: 'musicvideo', name: 'Music Video', desc: 'Stylized & vibrant', icon: 'M', color: '#f59e0b' },
];

const PROMPT_TEMPLATES = [
  'A serene mountain lake at golden hour with mist rising slowly from the water surface',
  'Drone shot over a neon-lit cyberpunk city at night with flying cars',
  'Slow motion close-up of a butterfly emerging from a cocoon in a garden',
  'Timelapse of clouds rolling over a vast desert landscape with shifting sand dunes',
  'An astronaut floating peacefully through a colorful nebula in deep space',
  'A calm ocean wave rolling onto a tropical beach at sunset with golden light',
];

const DEMO_GALLERY = [
  { title: 'Cinematic Sunset', desc: 'Golden hour over mountain lake', colors: ['#f97316', '#ef4444', '#fbbf24'] },
  { title: 'Neon Cityscape', desc: 'Cyberpunk night scene', colors: ['#8b5cf6', '#06b6d4', '#ec4899'] },
  { title: 'Ocean Waves', desc: 'Calm shoreline at twilight', colors: ['#0ea5e9', '#06b6d4', '#22d3ee'] },
  { title: 'Abstract Motion', desc: 'Geometric particle dance', colors: ['#10b981', '#34d399', '#6ee7b7'] },
  { title: 'Space Nebula', desc: 'Deep space exploration', colors: ['#6366f1', '#a855f7', '#ec4899'] },
  { title: 'Nature Close-up', desc: 'Macro butterfly wings', colors: ['#f59e0b', '#84cc16', '#22c55e'] },
];

/* ── Color / mood extraction from prompt ────────────────── */

interface PromptAnalysis {
  colors: string[];
  speed: number;
  shape: 'circles' | 'squares' | 'triangles' | 'waves' | 'particles';
  bgGradient: [string, string];
  words: string[];
}

function analyzePrompt(prompt: string): PromptAnalysis {
  const lower = prompt.toLowerCase();
  const words = lower.split(/\s+/).filter((w) => w.length > 2);

  const colorMap: Record<string, string[]> = {
    sunset: ['#f97316', '#ef4444', '#fbbf24', '#f43f5e'],
    sunrise: ['#fb923c', '#f472b6', '#fde68a', '#fbbf24'],
    ocean: ['#0ea5e9', '#06b6d4', '#22d3ee', '#67e8f9'],
    sea: ['#0ea5e9', '#06b6d4', '#22d3ee', '#67e8f9'],
    water: ['#3b82f6', '#0ea5e9', '#22d3ee', '#bfdbfe'],
    forest: ['#16a34a', '#22c55e', '#4ade80', '#166534'],
    nature: ['#22c55e', '#84cc16', '#a3e635', '#16a34a'],
    night: ['#1e1b4b', '#312e81', '#4338ca', '#6366f1'],
    neon: ['#f43f5e', '#8b5cf6', '#06b6d4', '#22d3ee'],
    cyberpunk: ['#ec4899', '#a855f7', '#06b6d4', '#8b5cf6'],
    space: ['#1e1b4b', '#6366f1', '#a855f7', '#ec4899'],
    fire: ['#ef4444', '#f97316', '#fbbf24', '#dc2626'],
    golden: ['#f59e0b', '#fbbf24', '#fde68a', '#d97706'],
    mountain: ['#6b7280', '#374151', '#9ca3af', '#4b5563'],
    desert: ['#d97706', '#f59e0b', '#fbbf24', '#92400e'],
    garden: ['#22c55e', '#f472b6', '#fbbf24', '#a855f7'],
    butterfly: ['#f472b6', '#a855f7', '#fbbf24', '#34d399'],
    city: ['#6366f1', '#f43f5e', '#fbbf24', '#06b6d4'],
    abstract: ['#8b5cf6', '#ec4899', '#06b6d4', '#f97316'],
    red: ['#ef4444', '#dc2626', '#f87171', '#fca5a5'],
    blue: ['#3b82f6', '#2563eb', '#60a5fa', '#93c5fd'],
    green: ['#22c55e', '#16a34a', '#4ade80', '#86efac'],
    purple: ['#8b5cf6', '#7c3aed', '#a78bfa', '#c4b5fd'],
    pink: ['#ec4899', '#db2777', '#f472b6', '#fbcfe8'],
    calm: ['#0ea5e9', '#06b6d4', '#67e8f9', '#a5f3fc'],
    energetic: ['#f43f5e', '#f97316', '#fbbf24', '#ef4444'],
  };

  let colors = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4'];
  for (const [keyword, cols] of Object.entries(colorMap)) {
    if (lower.includes(keyword)) {
      colors = cols;
      break;
    }
  }

  const fastWords = ['energetic', 'fast', 'action', 'explosion', 'dance', 'neon', 'cyberpunk', 'fire', 'storm'];
  const slowWords = ['calm', 'serene', 'peaceful', 'slow', 'gentle', 'mist', 'cloud', 'float', 'drift'];
  let speed = 1;
  if (fastWords.some((w) => lower.includes(w))) speed = 2;
  if (slowWords.some((w) => lower.includes(w))) speed = 0.5;

  const shapeMap: Record<string, PromptAnalysis['shape']> = {
    ocean: 'waves', wave: 'waves', water: 'waves', sea: 'waves',
    city: 'squares', building: 'squares', cyberpunk: 'squares', geometric: 'squares',
    mountain: 'triangles', peak: 'triangles', pyramid: 'triangles',
    particle: 'particles', star: 'particles', space: 'particles', nebula: 'particles',
    circle: 'circles', sun: 'circles', moon: 'circles', bubble: 'circles',
  };
  let shape: PromptAnalysis['shape'] = 'particles';
  for (const [keyword, s] of Object.entries(shapeMap)) {
    if (lower.includes(keyword)) {
      shape = s;
      break;
    }
  }

  const bgGradient: [string, string] = [colors[0], colors[1]];

  return { colors, speed, shape, bgGradient, words };
}

/* ── Style-specific renderers ───────────────────────────── */

interface Entity {
  x: number; y: number; vx: number; vy: number;
  size: number; color: string; phase: number;
  type?: string;
}

function createEntities(count: number, w: number, h: number, analysis: PromptAnalysis, speed: number): Entity[] {
  const entities: Entity[] = [];
  for (let i = 0; i < count; i++) {
    entities.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 2 * speed,
      vy: (Math.random() - 0.5) * 2 * speed,
      size: 4 + Math.random() * 16,
      color: analysis.colors[Math.floor(Math.random() * analysis.colors.length)],
      phase: Math.random() * Math.PI * 2,
    });
  }
  return entities;
}

/** Cinematic: warm tones, lens flares, smooth camera pan simulation */
function renderCinematic(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  t: number, time: number,
  analysis: PromptAnalysis,
  entities: Entity[],
) {
  // Warm base gradient that slowly rotates
  const cx = w / 2 + Math.sin(time * 0.3) * w * 0.15;
  const cy = h / 2 + Math.cos(time * 0.2) * h * 0.1;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.8);
  grad.addColorStop(0, analysis.bgGradient[0]);
  grad.addColorStop(0.5, analysis.colors[2] ?? analysis.bgGradient[1]);
  grad.addColorStop(1, '#1a0a00');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Warm overlay
  ctx.fillStyle = `rgba(255, 140, 50, ${0.06 + 0.03 * Math.sin(time * 0.5)})`;
  ctx.fillRect(0, 0, w, h);

  // Film grain simulation
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < 200; i++) {
    const gx = Math.random() * w;
    const gy = Math.random() * h;
    const gs = Math.random() * 2;
    ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
    ctx.fillRect(gx, gy, gs, gs);
  }
  ctx.globalAlpha = 1;

  // Horizontal light streaks (anamorphic flare)
  for (let i = 0; i < 3; i++) {
    const streakY = h * (0.3 + i * 0.2) + Math.sin(time * 0.4 + i) * 40;
    const streakAlpha = 0.05 + 0.03 * Math.sin(time * 0.6 + i * 2);
    ctx.save();
    ctx.globalAlpha = streakAlpha;
    const streakGrad = ctx.createLinearGradient(0, streakY - 30, 0, streakY + 30);
    streakGrad.addColorStop(0, 'rgba(255,180,80,0)');
    streakGrad.addColorStop(0.5, `${analysis.colors[0]}88`);
    streakGrad.addColorStop(1, 'rgba(255,180,80,0)');
    ctx.fillStyle = streakGrad;
    ctx.fillRect(0, streakY - 30, w, 60);
    ctx.restore();
  }

  // Smooth floating particles with glow
  for (const e of entities) {
    e.x += e.vx * 0.4 * analysis.speed;
    e.y += e.vy * 0.3 * analysis.speed;
    if (e.x < -e.size) e.x = w + e.size;
    if (e.x > w + e.size) e.x = -e.size;
    if (e.y < -e.size) e.y = h + e.size;
    if (e.y > h + e.size) e.y = -e.size;

    const pulse = 0.6 + 0.4 * Math.sin(time * 0.8 + e.phase);
    const eSize = e.size * pulse;

    ctx.save();
    ctx.globalAlpha = 0.6;
    const glowGrad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, eSize * 3);
    glowGrad.addColorStop(0, e.color + '55');
    glowGrad.addColorStop(0.5, e.color + '22');
    glowGrad.addColorStop(1, e.color + '00');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(e.x, e.y, eSize * 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 0.9;
    ctx.fillStyle = e.color;
    ctx.beginPath();
    ctx.arc(e.x, e.y, eSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Lens flare circles
  for (let lf = 0; lf < 3; lf++) {
    const lfx = w * (0.3 + 0.4 * Math.sin(time * 0.15 + lf * 2.1));
    const lfy = h * (0.2 + 0.15 * Math.cos(time * 0.1 + lf * 1.7));
    const lfSize = 60 + 40 * Math.sin(time * 0.25 + lf);
    ctx.save();
    ctx.globalAlpha = 0.08 + 0.04 * Math.sin(time * 0.5 + lf);
    const lfGrad = ctx.createRadialGradient(lfx, lfy, 0, lfx, lfy, lfSize);
    lfGrad.addColorStop(0, '#ffffffaa');
    lfGrad.addColorStop(0.3, analysis.colors[lf % analysis.colors.length] + '44');
    lfGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lfGrad;
    ctx.beginPath();
    ctx.arc(lfx, lfy, lfSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Cinematic letterbox bars
  const barH = h * 0.06;
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(0, 0, w, barH);
  ctx.fillRect(0, h - barH, w, barH);

  // Vignette
  const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.5)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
}

/** Animation: bright colors, bouncing shapes (circles, stars, triangles), playful */
function renderAnimation(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  t: number, time: number,
  analysis: PromptAnalysis,
  entities: Entity[],
) {
  // Bright pastel gradient background
  const grad = ctx.createLinearGradient(
    w * (0.5 + 0.5 * Math.sin(time * 0.3)),
    0,
    w * (0.5 + 0.5 * Math.cos(time * 0.4)),
    h,
  );
  grad.addColorStop(0, analysis.bgGradient[0] + 'cc');
  grad.addColorStop(0.5, analysis.colors[2] ?? '#fde68a');
  grad.addColorStop(1, analysis.bgGradient[1] + 'cc');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Lighten overlay
  ctx.fillStyle = `rgba(255, 255, 255, 0.15)`;
  ctx.fillRect(0, 0, w, h);

  // Bouncing background circles
  for (let i = 0; i < 8; i++) {
    const bx = w * (0.1 + 0.8 * ((Math.sin(time * 0.5 + i * 0.8) + 1) / 2));
    const by = h * (0.1 + 0.8 * ((Math.cos(time * 0.7 + i * 1.1) + 1) / 2));
    const bSize = 40 + 30 * Math.sin(time + i);
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = analysis.colors[i % analysis.colors.length];
    ctx.beginPath();
    ctx.arc(bx, by, bSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Bouncing animated entities with varied shapes
  const shapeTypes = ['circle', 'star', 'triangle', 'diamond'];
  for (let idx = 0; idx < entities.length; idx++) {
    const e = entities[idx];
    // Bouncing motion
    e.x += e.vx * 1.5 * analysis.speed;
    e.y += e.vy * 1.5 * analysis.speed;

    // Bounce off walls
    if (e.x < e.size || e.x > w - e.size) { e.vx *= -1; e.x = Math.max(e.size, Math.min(w - e.size, e.x)); }
    if (e.y < e.size || e.y > h - e.size) { e.vy *= -1; e.y = Math.max(e.size, Math.min(h - e.size, e.y)); }

    const bounce = Math.abs(Math.sin(time * 3 + e.phase));
    const eSize = e.size * (0.8 + 0.4 * bounce);
    const rotation = time * 2 + e.phase;

    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(rotation);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = e.color;

    const shapeType = shapeTypes[idx % shapeTypes.length];
    switch (shapeType) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, eSize, 0, Math.PI * 2);
        ctx.fill();
        // Highlight
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-eSize * 0.3, -eSize * 0.3, eSize * 0.35, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'star': {
        ctx.beginPath();
        for (let p = 0; p < 5; p++) {
          const angle = (p * Math.PI * 2) / 5 - Math.PI / 2;
          const outerX = Math.cos(angle) * eSize;
          const outerY = Math.sin(angle) * eSize;
          if (p === 0) ctx.moveTo(outerX, outerY);
          else ctx.lineTo(outerX, outerY);
          const innerAngle = angle + Math.PI / 5;
          ctx.lineTo(Math.cos(innerAngle) * eSize * 0.45, Math.sin(innerAngle) * eSize * 0.45);
        }
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -eSize);
        ctx.lineTo(eSize * 0.87, eSize * 0.5);
        ctx.lineTo(-eSize * 0.87, eSize * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -eSize);
        ctx.lineTo(eSize * 0.6, 0);
        ctx.lineTo(0, eSize);
        ctx.lineTo(-eSize * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        break;
    }

    // Outline
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  // Confetti-like small shapes
  for (let c = 0; c < 30; c++) {
    const cx2 = ((c * 137.5 + time * 50) % (w + 40)) - 20;
    const cy2 = ((c * 97.3 + time * 30 * (c % 3 === 0 ? 1 : 0.7)) % (h + 40)) - 20;
    ctx.save();
    ctx.translate(cx2, cy2);
    ctx.rotate(time * 4 + c);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = analysis.colors[c % analysis.colors.length];
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();
  }
}

/** Documentary: muted earth tones, text overlays appearing word-by-word */
function renderDocumentary(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  t: number, time: number,
  analysis: PromptAnalysis,
  entities: Entity[],
  promptWords: string[],
) {
  // Muted earth tone background
  const mutedColors = ['#78716c', '#a8a29e', '#57534e', '#44403c'];
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#292524');
  grad.addColorStop(0.5, mutedColors[Math.floor(time * 0.2) % mutedColors.length] + '44');
  grad.addColorStop(1, '#1c1917');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid pattern
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = '#a8a29e';
  ctx.lineWidth = 0.5;
  const gridSize = 40;
  for (let gx = 0; gx < w; gx += gridSize) {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, h);
    ctx.stroke();
  }
  for (let gy = 0; gy < h; gy += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w, gy);
    ctx.stroke();
  }
  ctx.restore();

  // Slow-moving muted particles
  for (const e of entities) {
    e.x += e.vx * 0.15;
    e.y += e.vy * 0.15;
    if (e.x < -e.size) e.x = w + e.size;
    if (e.x > w + e.size) e.x = -e.size;
    if (e.y < -e.size) e.y = h + e.size;
    if (e.y > h + e.size) e.y = -e.size;

    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#a8a29e';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Data-like horizontal lines
  for (let i = 0; i < 5; i++) {
    const ly = h * (0.15 + i * 0.15);
    const lw = w * (0.3 + 0.3 * Math.sin(time * 0.3 + i * 0.5));
    const lx = w * 0.1 + Math.sin(time * 0.2 + i) * 30;
    ctx.save();
    ctx.globalAlpha = 0.08 + 0.04 * Math.sin(time + i);
    ctx.strokeStyle = analysis.colors[0] ?? '#a8a29e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + lw, ly);
    ctx.stroke();
    // Small circle at the end
    ctx.fillStyle = analysis.colors[0] ?? '#a8a29e';
    ctx.beginPath();
    ctx.arc(lx + lw, ly, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Word-by-word text overlay
  const displayWords = promptWords.length > 0 ? promptWords : ['Documentary', 'Style', 'Preview'];
  const wordsToShow = Math.min(displayWords.length, Math.floor(time * 1.5) + 1);
  const textBlock = displayWords.slice(0, wordsToShow).join(' ');
  const fontSize = Math.round(Math.min(w * 0.04, 32));

  ctx.save();
  ctx.fillStyle = '#e7e5e4';
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.globalAlpha = 0.85;

  // Wrap text
  const maxLineW = w * 0.7;
  const lineWords = textBlock.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  for (const word of lineWords) {
    const test = currentLine ? currentLine + ' ' + word : word;
    if (ctx.measureText(test).width > maxLineW && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = test;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = fontSize * 1.4;
  const startY = h * 0.5 - (lines.length * lineHeight) / 2;
  for (let li = 0; li < lines.length; li++) {
    ctx.fillText(lines[li], w / 2, startY + li * lineHeight);
  }
  ctx.restore();

  // Typing cursor blink
  if (wordsToShow < displayWords.length) {
    const lastLine = lines.length > 0 ? lines[lines.length - 1] : '';
    ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
    const measuredW = lastLine ? ctx.measureText(lastLine).width : 0;
    const cursorX = w / 2 + measuredW / 2 + 4;
    const cursorY = startY + (lines.length - 1) * lineHeight;
    ctx.save();
    ctx.globalAlpha = Math.sin(time * 6) > 0 ? 0.8 : 0;
    ctx.fillStyle = analysis.colors[0] ?? '#ef4444';
    ctx.fillRect(cursorX, cursorY - fontSize * 0.4, 2, fontSize * 0.8);
    ctx.restore();
  }

  // Bottom bar with "fact" info
  const barHeight = h * 0.08;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(0, h - barHeight, w, barHeight);
  ctx.fillStyle = '#d6d3d1';
  ctx.font = `500 ${Math.round(barHeight * 0.35)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`TubeForge Documentary  |  ${Math.floor(time)}s`, 20, h - barHeight / 2);
  // Red accent line
  ctx.fillStyle = analysis.colors[0] ?? '#ef4444';
  ctx.fillRect(0, h - barHeight, w * t, 2);
  ctx.restore();
}

/** Music Video: neon colors, fast-moving particles, beat-like pulsing shapes */
function renderMusicVideo(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  t: number, time: number,
  analysis: PromptAnalysis,
  entities: Entity[],
) {
  // Dark background
  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, w, h);

  // Simulated beat (4 beats per second at tempo ~120 BPM)
  const beat = Math.pow(Math.sin(time * Math.PI * 2) * 0.5 + 0.5, 8);
  const halfBeat = Math.pow(Math.sin(time * Math.PI * 4) * 0.5 + 0.5, 4);

  // Neon radial pulse from center
  ctx.save();
  ctx.globalAlpha = 0.15 + beat * 0.2;
  const pulseGrad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * (0.3 + beat * 0.3));
  pulseGrad.addColorStop(0, analysis.colors[0] + 'aa');
  pulseGrad.addColorStop(0.5, analysis.colors[1] + '44');
  pulseGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = pulseGrad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();

  // Neon grid lines
  ctx.save();
  ctx.globalAlpha = 0.06 + halfBeat * 0.08;
  const neonGridSize = 60;
  ctx.strokeStyle = analysis.colors[2] ?? '#06b6d4';
  ctx.lineWidth = 1;
  for (let gx = 0; gx < w; gx += neonGridSize) {
    ctx.beginPath();
    ctx.moveTo(gx + Math.sin(time * 2 + gx * 0.01) * 3, 0);
    ctx.lineTo(gx + Math.sin(time * 2 + gx * 0.01 + 2) * 3, h);
    ctx.stroke();
  }
  for (let gy = 0; gy < h; gy += neonGridSize) {
    ctx.beginPath();
    ctx.moveTo(0, gy + Math.cos(time * 2 + gy * 0.01) * 3);
    ctx.lineTo(w, gy + Math.cos(time * 2 + gy * 0.01 + 2) * 3);
    ctx.stroke();
  }
  ctx.restore();

  // Fast-moving neon particles
  for (const e of entities) {
    e.x += e.vx * 3 * analysis.speed;
    e.y += e.vy * 3 * analysis.speed;
    if (e.x < -e.size) e.x = w + e.size;
    if (e.x > w + e.size) e.x = -e.size;
    if (e.y < -e.size) e.y = h + e.size;
    if (e.y > h + e.size) e.y = -e.size;

    const pulse2 = 0.5 + beat * 1.5 + 0.3 * Math.sin(time * 4 + e.phase);
    const eSize = e.size * pulse2;

    ctx.save();
    ctx.translate(e.x, e.y);

    // Neon glow
    ctx.globalAlpha = 0.5;
    const neonGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, eSize * 4);
    neonGrad.addColorStop(0, e.color + 'aa');
    neonGrad.addColorStop(0.3, e.color + '44');
    neonGrad.addColorStop(1, e.color + '00');
    ctx.fillStyle = neonGrad;
    ctx.beginPath();
    ctx.arc(0, 0, eSize * 4, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, eSize * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Trail
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = eSize * 0.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-e.vx * 8, -e.vy * 8);
    ctx.stroke();

    ctx.restore();
  }

  // Beat-pulsing rings
  for (let ring = 0; ring < 3; ring++) {
    const ringSize = (w * 0.15 + ring * w * 0.12) * (1 + beat * 0.3);
    ctx.save();
    ctx.globalAlpha = 0.15 - ring * 0.04 + beat * 0.1;
    ctx.strokeStyle = analysis.colors[ring % analysis.colors.length];
    ctx.lineWidth = 2 + beat * 4;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, ringSize, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Horizontal neon lines that pulse
  for (let nl = 0; nl < 4; nl++) {
    const nlY = h * (0.2 + nl * 0.2);
    const nlAlpha = halfBeat * 0.15;
    ctx.save();
    ctx.globalAlpha = nlAlpha;
    ctx.strokeStyle = analysis.colors[nl % analysis.colors.length];
    ctx.lineWidth = 3;
    ctx.shadowColor = analysis.colors[nl % analysis.colors.length];
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(0, nlY);
    ctx.lineTo(w, nlY);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  // Color flash on strong beats
  if (beat > 0.8) {
    ctx.save();
    ctx.globalAlpha = (beat - 0.8) * 0.5;
    ctx.fillStyle = analysis.colors[Math.floor(time * 4) % analysis.colors.length];
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}

/* ── Canvas video generator ─────────────────────────────── */

function generateVideo(
  prompt: string,
  durationSec: number,
  aspectStr: string,
  style: StylePresetId,
  onProgress: (pct: number) => void,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const analysis = analyzePrompt(prompt);
    const fps = 30;
    const totalFrames = durationSec * fps;

    const [canvasW, canvasH] = ASPECT_SIZES[aspectStr] ?? [1280, 720];

    const canvas = document.createElement('canvas');
    canvas.width = canvasW;
    canvas.height = canvasH;
    const ctx = canvas.getContext('2d');
    if (!ctx) { reject(new Error('Canvas not supported')); return; }

    // Check for MediaRecorder + webm support
    let mimeType = 'video/webm;codecs=vp9';
    if (typeof MediaRecorder === 'undefined') {
      reject(new Error('MediaRecorder not supported in this browser'));
      return;
    }
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          reject(new Error('WebM recording not supported in this browser'));
          return;
        }
      }
    }

    const stream = canvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      resolve(blob);
    };
    recorder.onerror = () => reject(new Error('Recording failed'));

    // Entity count varies by style
    const entityCount = style === 'musicvideo' ? 80 : style === 'animation' ? 50 : style === 'documentary' ? 30 : 60;
    const entitySpeed = style === 'musicvideo' ? 2 : style === 'animation' ? 1.5 : style === 'documentary' ? 0.5 : 1;
    const entities = createEntities(entityCount, canvasW, canvasH, analysis, entitySpeed);

    let frame = 0;
    recorder.start();

    function drawFrame() {
      const tNorm = frame / totalFrames; // 0..1
      const time = frame / fps;

      // Render style-specific scene
      switch (style) {
        case 'cinematic':
          renderCinematic(ctx!, canvasW, canvasH, tNorm, time, analysis, entities);
          break;
        case 'animation':
          renderAnimation(ctx!, canvasW, canvasH, tNorm, time, analysis, entities);
          break;
        case 'documentary':
          renderDocumentary(ctx!, canvasW, canvasH, tNorm, time, analysis, entities, analysis.words);
          break;
        case 'musicvideo':
          renderMusicVideo(ctx!, canvasW, canvasH, tNorm, time, analysis, entities);
          break;
      }

      // Watermark (all styles)
      ctx!.save();
      ctx!.globalAlpha = 0.12;
      ctx!.fillStyle = '#ffffff';
      ctx!.font = `${Math.round(canvasW * 0.018)}px sans-serif`;
      ctx!.textAlign = 'right';
      ctx!.fillText('TubeForge', canvasW - 20, canvasH - 16);
      ctx!.restore();

      // Report progress
      const pct = Math.round((frame / totalFrames) * 100);
      onProgress(pct);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(drawFrame);
      } else {
        recorder.stop();
      }
    }

    requestAnimationFrame(drawFrame);
  });
}

/* ── Main Component ─────────────────────────────────────── */

type GenerationPhase =
  | 'idle'
  | 'generating'
  | 'done'
  | 'error';

export function Veo3Generator() {
  const C = useThemeStore((s) => s.theme);
  const subscription = trpc.billing.getSubscription.useQuery();
  const plan = subscription.data?.plan ?? 'FREE';
  const isPro = plan === 'PRO' || plan === 'STUDIO';
  void isPro; // used later if we add gating

  const [prompt, setPrompt] = useState('');
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]>('5s');
  const [aspect, setAspect] = useState<(typeof ASPECTS)[number]>('16:9');
  const [stylePreset, setStylePreset] = useState<StylePresetId>('cinematic');
  const [phase, setPhase] = useState<GenerationPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generate' | 'gallery'>('generate');

  const videoRef = useRef<HTMLVideoElement>(null);
  const cancelledRef = useRef(false);

  // Cleanup video URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  const durationSec = parseInt(duration.replace('s', ''), 10);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || phase === 'generating') return;

    setPhase('generating');
    setProgress(0);
    setErrorMsg('');
    cancelledRef.current = false;
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }
    setVideoBlob(null);

    try {
      const blob = await generateVideo(
        prompt,
        durationSec,
        aspect,
        stylePreset,
        (pct) => {
          if (!cancelledRef.current) setProgress(pct);
        },
      );
      if (cancelledRef.current) return;
      setProgress(100);
      setVideoBlob(blob);
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setPhase('done');
    } catch (err) {
      if (cancelledRef.current) return;
      setErrorMsg(err instanceof Error ? err.message : 'Generation failed');
      setPhase('error');
    }
  }, [prompt, phase, durationSec, aspect, stylePreset, videoUrl]);

  const handleDownload = useCallback(() => {
    if (!videoBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(videoBlob);
    a.download = `tubeforge-${stylePreset}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }, [videoBlob, stylePreset]);

  const handlePromptGen = useCallback(() => {
    const template = PROMPT_TEMPLATES[Math.floor(Math.random() * PROMPT_TEMPLATES.length)];
    setPrompt(template);
  }, []);

  const handleReset = useCallback(() => {
    cancelledRef.current = true;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setPhase('idle');
    setProgress(0);
    setVideoBlob(null);
    setVideoUrl(null);
    setErrorMsg('');
  }, [videoUrl]);

  /* ── Styles ─────────────────────────────────────────── */

  const pillStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 18px', borderRadius: 10,
    border: `1px solid ${active ? GRADIENT[0] : C.border}`,
    background: active ? `${GRADIENT[0]}22` : C.card,
    color: active ? GRADIENT[0] : C.sub,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s ease', fontFamily: 'inherit',
    outline: 'none',
  });

  const sectionCard: React.CSSProperties = {
    padding: 20, borderRadius: 16,
    border: `1px solid ${C.border}`, background: C.card,
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', borderRadius: 10, border: 'none',
    background: active ? `${GRADIENT[0]}18` : 'transparent',
    color: active ? GRADIENT[0] : C.sub,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all 0.2s ease', fontFamily: 'inherit', outline: 'none',
  });

  /* ── Render ─────────────────────────────────────────── */

  return (
    <ToolPageShell
      title="AI Video Generator (VEO3)"
      subtitle="Generate stunning videos from text prompts with Canvas-powered rendering"
      gradient={GRADIENT}
      badge="BETA"
      badgeColor={GRADIENT[0]}
    >
      {/* Spin keyframes */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, padding: 4, borderRadius: 12, background: C.surface, width: 'fit-content' }}>
        <button onClick={() => setActiveTab('generate')} style={tabStyle(activeTab === 'generate')}>
          Generate
        </button>
        <button onClick={() => setActiveTab('gallery')} style={tabStyle(activeTab === 'gallery')}>
          Sample Gallery
        </button>
      </div>

      {activeTab === 'gallery' ? (
        /* ── Gallery Tab ─────────────────────────────────── */
        <div style={{ animation: 'fadeIn .3s ease' }}>
          <p style={{ fontSize: 14, color: C.sub, marginTop: 0, marginBottom: 20 }}>
            See what the generator can create. These samples showcase the styles and quality you can expect.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {DEMO_GALLERY.map((item) => (
              <div key={item.title} style={{
                borderRadius: 14, overflow: 'hidden',
                border: `1px solid ${C.border}`, background: C.card,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}>
                <div style={{
                  height: 140, position: 'relative',
                  background: `linear-gradient(135deg, ${item.colors[0]}, ${item.colors[1]}, ${item.colors[2]})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  </div>
                  <span style={{
                    position: 'absolute', top: 8, right: 8,
                    padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: 'rgba(0,0,0,0.5)', color: '#fff',
                  }}>
                    CANVAS
                  </span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Generate Tab ────────────────────────────────── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 24,
          animation: 'fadeIn .3s ease',
        }}>
          {/* Left: Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Prompt */}
            <div style={sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Text Prompt</span>
                <button
                  onClick={handlePromptGen}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${GRADIENT[0]}55`,
                    background: hoveredBtn === 'promptgen' ? `${GRADIENT[0]}22` : `${GRADIENT[0]}11`,
                    color: GRADIENT[0], cursor: 'pointer', transition: 'all 0.2s ease',
                    fontFamily: 'inherit', outline: 'none',
                  }}
                  onMouseEnter={() => setHoveredBtn('promptgen')}
                  onMouseLeave={() => setHoveredBtn(null)}
                >
                  Inspire Me
                </button>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_PROMPT_LENGTH) setPrompt(e.target.value);
                }}
                placeholder="Describe the video you want to generate... e.g. 'A serene mountain lake at golden hour with mist rising slowly'"
                style={{
                  width: '100%', minHeight: 130, padding: 14, borderRadius: 12,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: 14, fontFamily: 'inherit',
                  resize: 'vertical', outline: 'none',
                  transition: 'border-color 0.2s ease',
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{ fontSize: 11, color: C.dim }}>
                  Tip: Include colors, mood, and scene details for better results
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: prompt.length > MAX_PROMPT_LENGTH * 0.9 ? GRADIENT[0] : C.dim,
                }}>
                  {prompt.length}/{MAX_PROMPT_LENGTH}
                </span>
              </div>
            </div>

            {/* Style Presets */}
            <div style={sectionCard}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 14 }}>Style</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {STYLE_PRESETS.map((sp) => {
                  const isSelected = stylePreset === sp.id;
                  const isHovered = hoveredPreset === sp.id;
                  return (
                    <button
                      key={sp.id}
                      onClick={() => setStylePreset(sp.id)}
                      onMouseEnter={() => setHoveredPreset(sp.id)}
                      onMouseLeave={() => setHoveredPreset(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                        borderRadius: 12,
                        border: `1px solid ${isSelected ? sp.color : isHovered ? `${sp.color}88` : C.border}`,
                        background: isSelected ? `${sp.color}11` : isHovered ? `${sp.color}08` : C.surface,
                        cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit', textAlign: 'left',
                        outline: 'none',
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 8,
                        background: `linear-gradient(135deg, ${sp.color}33, ${sp.color}11)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: sp.color, flexShrink: 0,
                      }}>
                        {sp.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{sp.name}</div>
                        <div style={{ fontSize: 11, color: C.dim }}>{sp.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Duration & Aspect */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={sectionCard}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Duration</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {DURATIONS.map((d) => (
                    <button key={d} onClick={() => setDuration(d)} style={pillStyle(duration === d)}>{d}</button>
                  ))}
                </div>
              </div>
              <div style={sectionCard}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 12 }}>Aspect Ratio</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ASPECTS.map((a) => (
                    <button key={a} onClick={() => setAspect(a)} style={pillStyle(aspect === a)}>{a}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate button */}
            <ActionButton
              label={phase === 'generating' ? `Rendering... ${progress}%` : 'Generate Video'}
              gradient={GRADIENT}
              onClick={handleGenerate}
              loading={phase === 'generating'}
              disabled={!prompt.trim()}
            />
          </div>

          {/* Right: Video Preview */}
          <div style={{
            ...sectionCard,
            padding: 24,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Video Preview</span>
              {phase === 'done' && (
                <button
                  onClick={handleReset}
                  style={{
                    padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                    border: `1px solid ${C.border}`, background: C.surface,
                    color: C.sub, cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  New Video
                </button>
              )}
            </div>

            <div style={{
              flex: 1, minHeight: 380, borderRadius: 14,
              border: `1px solid ${C.border}`, background: C.surface,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* IDLE STATE */}
              {phase === 'idle' && (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.2" opacity={0.3}>
                    <rect x="2" y="2" width="20" height="20" rx="2.18" />
                    <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" />
                    <line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="7" x2="22" y2="7" />
                    <line x1="17" y1="17" x2="22" y2="17" />
                  </svg>
                  <div style={{ fontSize: 14, color: C.dim, marginTop: 12 }}>
                    Enter a prompt and click Generate
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 6, opacity: 0.7 }}>
                    Canvas renders animated visuals based on your prompt keywords and selected style
                  </div>
                </div>
              )}

              {/* GENERATING */}
              {phase === 'generating' && (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <svg width="48" height="48" viewBox="0 0 48 48" style={{ animation: 'spin 1.5s linear infinite' }}>
                    <circle cx="24" cy="24" r="20" stroke={`${GRADIENT[0]}33`} strokeWidth="3" fill="none" />
                    <path d="M24 4a20 20 0 0114.14 5.86" stroke={GRADIENT[0]} strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                  <div style={{ fontSize: 14, color: C.sub, fontWeight: 600, marginTop: 16 }}>
                    Rendering {stylePreset} video...
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 6 }}>
                    {durationSec}s at {ASPECT_SIZES[aspect]?.[0]}x{ASPECT_SIZES[aspect]?.[1]} ({aspect})
                  </div>
                  {/* Progress bar */}
                  <div style={{
                    marginTop: 20, width: 260, height: 6, borderRadius: 3,
                    background: C.border, overflow: 'hidden', marginLeft: 'auto', marginRight: 'auto',
                  }}>
                    <div style={{
                      width: `${progress}%`, height: '100%', borderRadius: 3,
                      background: `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                      transition: 'width 0.15s ease',
                    }} />
                  </div>
                  <div style={{ fontSize: 12, color: C.dim, marginTop: 8, fontVariantNumeric: 'tabular-nums' }}>{progress}%</div>
                </div>
              )}

              {/* ERROR */}
              {phase === 'error' && (
                <div style={{ textAlign: 'center', padding: 32, animation: 'fadeIn .3s ease' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12, margin: '0 auto 16px',
                    background: `${GRADIENT[0]}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>
                    Generation Failed
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 6, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
                    {errorMsg || 'Something went wrong. Please try again.'}
                  </div>
                  <button
                    onClick={handleReset}
                    style={{
                      marginTop: 16, padding: '8px 20px', borderRadius: 10,
                      border: `1px solid ${GRADIENT[0]}55`, background: `${GRADIENT[0]}11`,
                      color: GRADIENT[0], fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                    }}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* DONE - VIDEO READY */}
              {phase === 'done' && videoUrl && (
                <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    autoPlay
                    loop
                    style={{
                      width: '100%', height: '100%', objectFit: 'contain',
                      borderRadius: 14, display: 'block',
                    }}
                  />
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    padding: '4px 10px', borderRadius: 6,
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                    color: '#fff', fontSize: 11, fontWeight: 600,
                  }}>
                    {STYLE_PRESETS.find((sp) => sp.id === stylePreset)?.name ?? 'Canvas'} | {aspect}
                  </div>
                </div>
              )}
            </div>

            {/* Download button when done */}
            {phase === 'done' && videoBlob && (
              <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                <button
                  onClick={handleDownload}
                  onMouseEnter={() => setHoveredBtn('download')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    flex: 1, minWidth: 160,
                    padding: '12px 20px', borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: hoveredBtn === 'download' ? C.surface : C.card,
                    color: C.text, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit', outline: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download WebM ({(videoBlob.size / 1024 / 1024).toFixed(1)} MB)
                </button>
                <button
                  onClick={handleGenerate}
                  onMouseEnter={() => setHoveredBtn('regen')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    padding: '12px 20px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                    color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s ease', fontFamily: 'inherit', outline: 'none',
                    boxShadow: `0 4px 12px ${GRADIENT[0]}33`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="23 4 23 10 17 10" />
                    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
                  </svg>
                  Regenerate
                </button>
              </div>
            )}

            {/* Style info */}
            {(phase === 'done' || phase === 'idle') && (
              <div style={{
                marginTop: 16, padding: '14px 18px', borderRadius: 12,
                background: `linear-gradient(135deg, ${GRADIENT[0]}06, ${GRADIENT[1]}06)`,
                border: `1px solid ${GRADIENT[0]}15`,
                display: 'flex', gap: 12, alignItems: 'flex-start',
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    Canvas Video Generator
                  </div>
                  <div style={{ fontSize: 12, color: C.sub, marginTop: 4, lineHeight: 1.5 }}>
                    Renders animated scenes using HTML5 Canvas + MediaRecorder. Each style preset creates unique visuals: Cinematic (warm tones, lens flares), Animation (bouncing shapes), Documentary (text overlays), Music Video (neon particles, beat pulses).
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ToolPageShell>
  );
}
