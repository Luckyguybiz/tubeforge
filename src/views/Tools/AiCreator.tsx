'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#f59e0b', '#f97316'];

/* ================================================================== */
/*  TYPES & CONSTANTS                                                  */
/* ================================================================== */

type AvatarStyleId = 'photo' | 'cartoon' | 'professional' | 'robot' | 'anime';
type BackgroundId = 'office' | 'studio' | 'nature' | 'abstract' | 'transparent';
type ScriptCategory = 'tech-review' | 'tutorial' | 'motivational' | 'product-demo' | 'news';
type SubtitleStyle = 'classic' | 'bold' | 'outline' | 'karaoke';
type VideoQuality = '720p' | '1080p';
type AspectRatio = '16:9' | '9:16' | '1:1';

interface AvatarStyle {
  id: AvatarStyleId;
  name: string;
  color: string;
  description: string;
}

interface Background {
  id: BackgroundId;
  name: string;
  color: string;
  description: string;
}

interface ScriptTemplate {
  category: ScriptCategory;
  name: string;
  body: string;
}

/* Animation state that persists across frames */
interface AnimState {
  blinkTimer: number;
  nextBlinkAt: number;
  blinkDuration: number;
  isBlinking: boolean;
  headOffsetX: number;
  headOffsetY: number;
  headTargetX: number;
  headTargetY: number;
  headMoveTimer: number;
  browRaise: number;
  browTarget: number;
  mouthSmooth: number;
  cloudOffsets: number[];
  floatingShapes: FloatingShape[];
}

interface FloatingShape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  type: 'circle' | 'triangle' | 'square' | 'diamond';
  alpha: number;
  hue: number;
}

const MAX_SCRIPT_CHARS = 3000;

const AVATAR_STYLES: AvatarStyle[] = [
  { id: 'photo', name: 'Photo Realistic', color: '#3b82f6', description: 'Uploaded photo with animated overlays' },
  { id: 'cartoon', name: 'Cartoon', color: '#10b981', description: 'Big eyes, round head, fun expressions' },
  { id: 'professional', name: 'Professional', color: '#8b5cf6', description: 'Business avatar with suit and clean look' },
  { id: 'robot', name: 'Robot', color: '#06b6d4', description: 'Futuristic robot with glowing elements' },
  { id: 'anime', name: 'Anime', color: '#ec4899', description: 'Anime-style character with large eyes' },
];

const BACKGROUNDS: Background[] = [
  { id: 'office', name: 'Office', color: '#64748b', description: 'Desk, monitor, plant' },
  { id: 'studio', name: 'Studio', color: '#1e1b4b', description: 'Dark background with colored lights' },
  { id: 'nature', name: 'Nature', color: '#22c55e', description: 'Sky gradient with animated clouds' },
  { id: 'abstract', name: 'Abstract', color: '#a855f7', description: 'Animated gradient with shapes' },
  { id: 'transparent', name: 'Transparent', color: '#94a3b8', description: 'Checkerboard for compositing' },
];

const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    category: 'tech-review',
    name: 'Tech Review',
    body: `Hey everyone, welcome back to the channel. Today we are taking a deep dive into the latest tech that is making waves in the industry. [pause:1s] First, let us talk about the design. It is sleek, modern, and feels premium in the hand. The build quality is exceptional. [pause:1s] Now for performance, this device absolutely flies. Whether you are multitasking, gaming, or editing video, it handles everything with ease. [pause:1s] Battery life is solid too, easily lasting through a full day of heavy use. [pause:1s] So, should you buy it? If you are looking for top-tier performance and do not mind the price, this is absolutely worth your money. Let me know your thoughts in the comments below.`,
  },
  {
    category: 'tutorial',
    name: 'Tutorial',
    body: `Welcome to this step-by-step tutorial. By the end of this video, you will know exactly how to get started. [pause:1s] Step one: set up your environment. Make sure you have all the prerequisites installed and ready to go. [pause:1s] Step two: create your first project. Open your editor and follow along as I walk you through the initial configuration. [pause:1s] Step three: build the core functionality. This is where the magic happens. Pay close attention to the details here. [pause:1s] Step four: test everything thoroughly. Never skip testing, it will save you hours of debugging later. [pause:1s] And that is it! You now have a fully working project. If you found this helpful, hit that like button and subscribe for more tutorials.`,
  },
  {
    category: 'motivational',
    name: 'Motivational',
    body: `Listen, I need you to hear this today. [pause:2s] Every single person who has ever achieved greatness started exactly where you are right now. Uncertain, maybe a little scared, but willing to try. [pause:1s] The difference between those who succeed and those who do not is simple. It is not talent. It is not luck. It is the decision to keep going when everything in you wants to quit. [pause:1s] You are stronger than you think. You are more capable than you believe. And the world needs what only you can offer. [pause:2s] So get up. Take that first step. And never, ever look back. You were built for this.`,
  },
  {
    category: 'product-demo',
    name: 'Product Demo',
    body: `Introducing something that is going to change the way you work. [pause:1s] This product was designed with one goal in mind: to make your life easier. Let me show you exactly how it works. [pause:1s] First, notice the intuitive interface. Everything is right where you would expect it. No learning curve, no confusion. [pause:1s] Second, look at the speed. Tasks that used to take hours now take minutes. That is real productivity. [pause:1s] Third, the integration capabilities. It works seamlessly with the tools you already use. [pause:1s] And the best part? You can try it completely free for thirty days. No credit card required. Click the link below to get started today.`,
  },
  {
    category: 'news',
    name: 'News Update',
    body: `Good evening, and welcome to your daily briefing. Here are the top stories you need to know about today. [pause:1s] In our lead story, major developments are unfolding in the technology sector. Industry leaders announced groundbreaking partnerships that could reshape the landscape. [pause:1s] In business news, markets showed strong performance driven by positive economic data. Analysts remain cautiously optimistic about the outlook for the coming quarter. [pause:1s] And in science, researchers have made a breakthrough discovery that could have far-reaching implications for healthcare. [pause:1s] That wraps up today's headlines. Stay informed, stay engaged, and we will see you next time.`,
  },
];

const SUBTITLE_STYLES: { id: SubtitleStyle; name: string }[] = [
  { id: 'classic', name: 'Classic' },
  { id: 'bold', name: 'Bold' },
  { id: 'outline', name: 'Outline' },
  { id: 'karaoke', name: 'Karaoke' },
];

/* ================================================================== */
/*  UTILITY: Rounded rectangle helper                                  */
/* ================================================================== */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function fillRoundedRect(
  ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  drawRoundedRect(ctx, x, y, w, h, r);
  ctx.fill();
}

/* ================================================================== */
/*  ANIMATION STATE                                                    */
/* ================================================================== */
function createAnimState(w: number, h: number): AnimState {
  const shapes: FloatingShape[] = [];
  for (let i = 0; i < 15; i++) {
    shapes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.6 - 0.15,
      size: 8 + Math.random() * 30,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.02,
      type: (['circle', 'triangle', 'square', 'diamond'] as const)[Math.floor(Math.random() * 4)],
      alpha: 0.04 + Math.random() * 0.08,
      hue: Math.random() * 360,
    });
  }
  return {
    blinkTimer: 0,
    nextBlinkAt: 3 + Math.random() * 2,
    blinkDuration: 0.15,
    isBlinking: false,
    headOffsetX: 0,
    headOffsetY: 0,
    headTargetX: 0,
    headTargetY: 0,
    headMoveTimer: 0,
    browRaise: 0,
    browTarget: 0,
    mouthSmooth: 0,
    cloudOffsets: [0, 200, 450],
    floatingShapes: shapes,
  };
}

function updateAnimState(st: AnimState, dt: number, mouthRaw: number, isSpeaking: boolean) {
  /* -- Blinking -- */
  st.blinkTimer += dt;
  if (!st.isBlinking && st.blinkTimer >= st.nextBlinkAt) {
    st.isBlinking = true;
    st.blinkTimer = 0;
    st.blinkDuration = 0.1 + Math.random() * 0.08;
  }
  if (st.isBlinking && st.blinkTimer >= st.blinkDuration) {
    st.isBlinking = false;
    st.blinkTimer = 0;
    st.nextBlinkAt = 3 + Math.random() * 2;
  }

  /* -- Head micro-movements -- */
  st.headMoveTimer += dt;
  if (st.headMoveTimer > 1.5 + Math.random()) {
    st.headMoveTimer = 0;
    st.headTargetX = (Math.random() - 0.5) * 6;
    st.headTargetY = (Math.random() - 0.5) * 4;
  }
  st.headOffsetX += (st.headTargetX - st.headOffsetX) * 0.03;
  st.headOffsetY += (st.headTargetY - st.headOffsetY) * 0.03;
  // Add gentle sway
  st.headOffsetX += Math.sin(performance.now() / 2000) * 0.15;
  st.headOffsetY += Math.cos(performance.now() / 2500) * 0.1;

  /* -- Brow raise on emphasis -- */
  if (isSpeaking && mouthRaw > 0.65) {
    st.browTarget = 1;
  } else {
    st.browTarget = 0;
  }
  st.browRaise += (st.browTarget - st.browRaise) * 0.08;

  /* -- Smooth mouth -- */
  st.mouthSmooth += (mouthRaw - st.mouthSmooth) * 0.25;

  /* -- Cloud animation -- */
  for (let i = 0; i < st.cloudOffsets.length; i++) {
    st.cloudOffsets[i] += (0.2 + i * 0.1) * dt * 30;
  }

  /* -- Floating shapes -- */
  for (const s of st.floatingShapes) {
    s.x += s.vx * dt * 60;
    s.y += s.vy * dt * 60;
    s.rotation += s.rotSpeed;
    if (s.x < -50) s.x += 1200;
    if (s.x > 1200) s.x -= 1200;
    if (s.y < -50) s.y += 800;
    if (s.y > 800) s.y -= 800;
  }
}

/* ================================================================== */
/*  BACKGROUND RENDERERS                                               */
/* ================================================================== */
function drawBgOffice(ctx: CanvasRenderingContext2D, w: number, h: number, _t: number) {
  // Wall
  ctx.fillStyle = '#e8e0d4';
  ctx.fillRect(0, 0, w, h);

  // Floor
  ctx.fillStyle = '#8b7355';
  ctx.fillRect(0, h * 0.7, w, h * 0.3);
  ctx.fillStyle = '#7a6548';
  ctx.fillRect(0, h * 0.7, w, 4);

  // Window (right side)
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(w * 0.65, h * 0.08, w * 0.25, h * 0.35);
  ctx.strokeStyle = '#d4c5a9';
  ctx.lineWidth = 6;
  ctx.strokeRect(w * 0.65, h * 0.08, w * 0.25, h * 0.35);
  // Window cross
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(w * 0.775, h * 0.08);
  ctx.lineTo(w * 0.775, h * 0.43);
  ctx.moveTo(w * 0.65, h * 0.255);
  ctx.lineTo(w * 0.9, h * 0.255);
  ctx.stroke();

  // Desk
  ctx.fillStyle = '#a0845c';
  ctx.fillRect(w * 0.05, h * 0.58, w * 0.55, h * 0.06);
  ctx.fillStyle = '#8b7348';
  ctx.fillRect(w * 0.1, h * 0.64, 12, h * 0.06);
  ctx.fillRect(w * 0.5, h * 0.64, 12, h * 0.06);

  // Monitor on desk
  ctx.fillStyle = '#2d2d2d';
  ctx.fillRect(w * 0.2, h * 0.38, w * 0.2, h * 0.16);
  ctx.fillStyle = '#4a90d9';
  ctx.fillRect(w * 0.21, h * 0.39, w * 0.18, h * 0.14);
  // Monitor stand
  ctx.fillStyle = '#555';
  ctx.fillRect(w * 0.28, h * 0.54, w * 0.04, h * 0.04);
  ctx.fillRect(w * 0.25, h * 0.57, w * 0.1, h * 0.015);

  // Plant (left)
  ctx.fillStyle = '#8b4513';
  fillRoundedRect(ctx, w * 0.06, h * 0.48, 30, 40, 4);
  // Leaves
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = `hsl(${120 + i * 10}, 55%, ${35 + i * 4}%)`;
    ctx.beginPath();
    const lx = w * 0.06 + 15;
    const ly = h * 0.48;
    const angle = -Math.PI / 2 + (i - 2) * 0.5;
    ctx.ellipse(lx + Math.cos(angle) * 18, ly + Math.sin(angle) * 18, 14, 7, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bookshelf (right wall)
  ctx.fillStyle = '#a0845c';
  ctx.fillRect(w * 0.7, h * 0.5, w * 0.2, h * 0.04);
  ctx.fillRect(w * 0.7, h * 0.58, w * 0.2, h * 0.04);
  // Books
  const bookColors = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#e74c3c', '#16a085'];
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = bookColors[i % bookColors.length];
    ctx.fillRect(w * 0.71 + i * 18, h * 0.43, 14, h * 0.07);
  }
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = bookColors[(i + 3) % bookColors.length];
    ctx.fillRect(w * 0.72 + i * 20, h * 0.51, 16, h * 0.07);
  }
}

function drawBgStudio(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  // Dark background
  ctx.fillStyle = '#0a0a12';
  ctx.fillRect(0, 0, w, h);

  // Colored light beams
  const lights = [
    { x: w * 0.2, color: '#ff006630', angle: -0.3 },
    { x: w * 0.5, color: '#0066ff20', angle: 0 },
    { x: w * 0.8, color: '#ff660025', angle: 0.3 },
  ];
  for (const light of lights) {
    const glow = ctx.createRadialGradient(
      light.x + Math.sin(t * 0.3 + light.angle * 5) * 30,
      -50,
      10,
      light.x,
      h * 0.5,
      h * 0.7,
    );
    glow.addColorStop(0, light.color);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
  }

  // Subtle floor gradient
  const floorGrad = ctx.createLinearGradient(0, h * 0.7, 0, h);
  floorGrad.addColorStop(0, 'transparent');
  floorGrad.addColorStop(1, '#ffffff06');
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, h * 0.7, w, h * 0.3);

  // Floor reflection line
  ctx.strokeStyle = '#ffffff0a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h * 0.78);
  ctx.lineTo(w, h * 0.78);
  ctx.stroke();
}

function drawBgNature(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, anim: AnimState) {
  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.65);
  skyGrad.addColorStop(0, '#1a8fe0');
  skyGrad.addColorStop(0.5, '#56b4f5');
  skyGrad.addColorStop(1, '#87ceeb');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, w, h * 0.65);

  // Sun
  const sunX = w * 0.8;
  const sunY = h * 0.12;
  const sunGlow = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 100);
  sunGlow.addColorStop(0, '#fff9c4');
  sunGlow.addColorStop(0.3, '#ffee5840');
  sunGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = sunGlow;
  ctx.fillRect(sunX - 100, sunY - 100, 200, 200);
  ctx.fillStyle = '#fff9c4';
  ctx.beginPath();
  ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
  ctx.fill();

  // Animated clouds
  for (let i = 0; i < anim.cloudOffsets.length; i++) {
    const cx = (anim.cloudOffsets[i] % (w + 200)) - 100;
    const cy = h * 0.1 + i * h * 0.12;
    const scale = 0.7 + i * 0.2;
    ctx.fillStyle = `rgba(255,255,255,${0.7 - i * 0.15})`;
    ctx.beginPath();
    ctx.arc(cx, cy, 25 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 25 * scale, cy - 8 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 50 * scale, cy, 22 * scale, 0, Math.PI * 2);
    ctx.arc(cx - 20 * scale, cy + 5 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Hills
  ctx.fillStyle = '#4caf50';
  ctx.beginPath();
  ctx.moveTo(0, h * 0.65);
  ctx.quadraticCurveTo(w * 0.25, h * 0.52, w * 0.5, h * 0.6);
  ctx.quadraticCurveTo(w * 0.75, h * 0.68, w, h * 0.58);
  ctx.lineTo(w, h * 0.65);
  ctx.fill();

  // Grass field
  const grassGrad = ctx.createLinearGradient(0, h * 0.6, 0, h);
  grassGrad.addColorStop(0, '#4caf50');
  grassGrad.addColorStop(0.5, '#388e3c');
  grassGrad.addColorStop(1, '#2e7d32');
  ctx.fillStyle = grassGrad;
  ctx.fillRect(0, h * 0.63, w, h * 0.37);

  // Grass blades
  ctx.strokeStyle = '#66bb6a';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 30; i++) {
    const gx = (i / 30) * w + Math.sin(i * 7) * 20;
    const gy = h * 0.63 + Math.abs(Math.sin(i * 3)) * h * 0.15;
    const sway = Math.sin(t * 1.5 + i * 0.7) * 5;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.quadraticCurveTo(gx + sway, gy - 15, gx + sway * 1.5, gy - 25);
    ctx.stroke();
  }

  // Simple tree
  ctx.fillStyle = '#5d4037';
  ctx.fillRect(w * 0.12 - 6, h * 0.42, 12, h * 0.22);
  ctx.fillStyle = '#2e7d32';
  ctx.beginPath();
  ctx.arc(w * 0.12, h * 0.38, 35, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#388e3c';
  ctx.beginPath();
  ctx.arc(w * 0.12 - 15, h * 0.4, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(w * 0.12 + 18, h * 0.39, 24, 0, Math.PI * 2);
  ctx.fill();
}

function drawBgAbstract(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, anim: AnimState) {
  // Animated gradient
  const shift = (t * 0.1) % 1;
  const grad = ctx.createLinearGradient(
    w * 0.5 + Math.sin(shift * Math.PI * 2) * w * 0.4,
    0,
    w * 0.5 - Math.cos(shift * Math.PI * 2 + 1) * w * 0.4,
    h,
  );
  const hue1 = (t * 15) % 360;
  const hue2 = (hue1 + 60) % 360;
  const hue3 = (hue1 + 120) % 360;
  grad.addColorStop(0, `hsl(${hue1}, 60%, 15%)`);
  grad.addColorStop(0.33, `hsl(${hue2}, 50%, 12%)`);
  grad.addColorStop(0.66, `hsl(${hue3}, 55%, 14%)`);
  grad.addColorStop(1, `hsl(${hue1}, 45%, 10%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Floating shapes
  for (const s of anim.floatingShapes) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rotation);
    ctx.globalAlpha = s.alpha;
    ctx.fillStyle = `hsl(${(s.hue + t * 10) % 360}, 70%, 60%)`;

    switch (s.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, s.size, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.87, s.size * 0.5);
        ctx.lineTo(-s.size * 0.87, s.size * 0.5);
        ctx.closePath();
        ctx.fill();
        break;
      case 'square':
        ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
        break;
      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -s.size);
        ctx.lineTo(s.size * 0.6, 0);
        ctx.lineTo(0, s.size);
        ctx.lineTo(-s.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        break;
    }
    ctx.restore();
  }

  // Radial glow in center
  const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
  glow.addColorStop(0, `hsla(${(hue2 + 30) % 360}, 70%, 50%, 0.06)`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
}

function drawBgTransparent(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const size = 20;
  for (let y = 0; y < h; y += size) {
    for (let x = 0; x < w; x += size) {
      const isLight = ((x / size) + (y / size)) % 2 === 0;
      ctx.fillStyle = isLight ? '#cccccc' : '#999999';
      ctx.fillRect(x, y, size, size);
    }
  }
}

/* ================================================================== */
/*  AVATAR RENDERERS                                                   */
/* ================================================================== */
function drawAvatarPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number, cy: number, radius: number,
  mouth: number, anim: AnimState, _t: number,
) {
  const imgW = img.width;
  const imgH = img.height;
  const scale = Math.max((radius * 2) / imgW, (radius * 2) / imgH);
  const dw = imgW * scale;
  const dh = imgH * scale;
  ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh);

  /* Procedural face mesh overlay for lip sync */

  // Eye blink overlay
  if (anim.isBlinking) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    // Left eye area
    ctx.beginPath();
    ctx.ellipse(-radius * 0.18, -radius * 0.12, radius * 0.12, radius * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
    // Right eye area
    ctx.beginPath();
    ctx.ellipse(radius * 0.18, -radius * 0.12, radius * 0.12, radius * 0.04, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth movement overlay
  if (mouth > 0.05) {
    const mouthY = radius * 0.32;
    const mouthW = 14 + mouth * 10;
    const mouthH = 3 + mouth * 14;

    // Dark shadow for open mouth
    ctx.fillStyle = `rgba(20, 10, 10, ${0.1 + mouth * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(0, mouthY, mouthW, mouthH, 0, 0, Math.PI * 2);
    ctx.fill();

    // Slight teeth hint
    if (mouth > 0.4) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(mouth - 0.4) * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(0, mouthY - mouthH * 0.3, mouthW * 0.6, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Eyebrow raise indicator (subtle shadow shift)
  if (anim.browRaise > 0.1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${anim.browRaise * 0.06})`;
    ctx.fillRect(-radius * 0.4, -radius * 0.35, radius * 0.8, radius * 0.1);
  }
}

function drawAvatarCartoon(
  ctx: CanvasRenderingContext2D,
  _cx: number, _cy: number, radius: number,
  mouth: number, anim: AnimState, t: number,
) {
  const w = radius * 2;
  const h = radius * 2;
  const cx = 0, cy = 0;

  // Big round head
  ctx.fillStyle = '#ffeaa7';
  ctx.beginPath();
  ctx.arc(cx, cy - 5, radius * 0.58, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fdcb6e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy - 5, radius * 0.58, 0, Math.PI * 2);
  ctx.stroke();

  // Hair (spiky)
  ctx.fillStyle = '#e17055';
  for (let i = 0; i < 5; i++) {
    const angle = -Math.PI / 2 + (i - 2) * 0.35;
    const tipX = cx + Math.cos(angle) * radius * 0.72;
    const tipY = cy - 5 + Math.sin(angle) * radius * 0.72;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle - 0.15) * radius * 0.5, cy - 5 + Math.sin(angle - 0.15) * radius * 0.5);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(cx + Math.cos(angle + 0.15) * radius * 0.5, cy - 5 + Math.sin(angle + 0.15) * radius * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  // Eyes
  const eyeScale = 1.0;
  if (anim.isBlinking) {
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.3, cy - radius * 0.12);
    ctx.lineTo(cx - radius * 0.1, cy - radius * 0.12);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + radius * 0.1, cy - radius * 0.12);
    ctx.lineTo(cx + radius * 0.3, cy - radius * 0.12);
    ctx.stroke();
  } else {
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - radius * 0.2, cy - radius * 0.12, radius * 0.14 * eyeScale, radius * 0.18 * eyeScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + radius * 0.2, cy - radius * 0.12, radius * 0.14 * eyeScale, radius * 0.18 * eyeScale, 0, 0, Math.PI * 2);
    ctx.fill();
    // Outline
    ctx.strokeStyle = '#2d3436';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx - radius * 0.2, cy - radius * 0.12, radius * 0.14 * eyeScale, radius * 0.18 * eyeScale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + radius * 0.2, cy - radius * 0.12, radius * 0.14 * eyeScale, radius * 0.18 * eyeScale, 0, 0, Math.PI * 2);
    ctx.stroke();
    // Pupils (follow slight look direction)
    const lookX = Math.sin(t * 0.5) * 2;
    ctx.fillStyle = '#2d3436';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.17 + lookX, cy - radius * 0.1, radius * 0.065, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + radius * 0.23 + lookX, cy - radius * 0.1, radius * 0.065, 0, Math.PI * 2);
    ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.15 + lookX, cy - radius * 0.14, radius * 0.025, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + radius * 0.25 + lookX, cy - radius * 0.14, radius * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyebrows (with raise)
  const browOff = -anim.browRaise * 6;
  ctx.strokeStyle = '#2d3436';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx - radius * 0.2, cy - radius * 0.25 + browOff, radius * 0.15, Math.PI + 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx + radius * 0.2, cy - radius * 0.25 + browOff, radius * 0.15, Math.PI + 0.3, Math.PI * 2 - 0.3);
  ctx.stroke();

  // Mouth
  if (mouth > 0.05) {
    ctx.fillStyle = '#e17055';
    const mh = radius * 0.05 + mouth * radius * 0.14;
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.15, radius * 0.12 + mouth * radius * 0.05, mh, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tongue
    if (mouth > 0.3) {
      ctx.fillStyle = '#c0392b';
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius * 0.15 + mh * 0.3, radius * 0.06, mh * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = '#e17055';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy + radius * 0.12, radius * 0.15, 0.15, Math.PI - 0.15);
    ctx.stroke();
  }

  // Cheeks
  ctx.fillStyle = 'rgba(255,150,150,0.35)';
  ctx.beginPath();
  ctx.ellipse(cx - radius * 0.38, cy + radius * 0.03, radius * 0.09, radius * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + radius * 0.38, cy + radius * 0.03, radius * 0.09, radius * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#00b894';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.3, cy + radius * 0.52);
  ctx.lineTo(cx - radius * 0.45, radius);
  ctx.lineTo(cx + radius * 0.45, radius);
  ctx.lineTo(cx + radius * 0.3, cy + radius * 0.52);
  ctx.closePath();
  ctx.fill();
}

function drawAvatarProfessional(
  ctx: CanvasRenderingContext2D,
  _cx: number, _cy: number, radius: number,
  mouth: number, anim: AnimState, t: number,
) {
  const cx = 0, cy = 0;

  // Head
  ctx.fillStyle = '#e8d5b7';
  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.08, radius * 0.54, 0, Math.PI * 2);
  ctx.fill();

  // Hair (clean professional)
  ctx.fillStyle = '#2c3e50';
  ctx.beginPath();
  ctx.ellipse(cx, cy - radius * 0.42, radius * 0.5, radius * 0.26, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - radius * 0.5, cy - radius * 0.42, radius * 0.08, radius * 0.2);
  ctx.fillRect(cx + radius * 0.42, cy - radius * 0.42, radius * 0.08, radius * 0.2);

  // Eyes
  if (anim.isBlinking) {
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.25, cy - radius * 0.1);
    ctx.lineTo(cx - radius * 0.1, cy - radius * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + radius * 0.1, cy - radius * 0.1);
    ctx.lineTo(cx + radius * 0.25, cy - radius * 0.1);
    ctx.stroke();
  } else {
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - radius * 0.17, cy - radius * 0.1, radius * 0.07, radius * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + radius * 0.17, cy - radius * 0.1, radius * 0.07, radius * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    // Iris
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.17, cy - radius * 0.1, radius * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + radius * 0.17, cy - radius * 0.1, radius * 0.04, 0, Math.PI * 2);
    ctx.fill();
    // Light dots
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.155, cy - radius * 0.115, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + radius * 0.185, cy - radius * 0.115, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyebrows
  const browOff = -anim.browRaise * 5;
  ctx.strokeStyle = '#2c3e50';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.26, cy - radius * 0.2 + browOff);
  ctx.lineTo(cx - radius * 0.08, cy - radius * 0.22 + browOff);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.08, cy - radius * 0.22 + browOff);
  ctx.lineTo(cx + radius * 0.26, cy - radius * 0.2 + browOff);
  ctx.stroke();

  // Nose
  ctx.strokeStyle = '#c4a882';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius * 0.04);
  ctx.lineTo(cx - radius * 0.04, cy + radius * 0.04);
  ctx.lineTo(cx + radius * 0.04, cy + radius * 0.04);
  ctx.stroke();

  // Mouth
  if (mouth > 0.05) {
    const mh = 3 + mouth * 12;
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.17, radius * 0.08 + mouth * radius * 0.03, mh, 0, 0, Math.PI * 2);
    ctx.fill();
    // Teeth
    if (mouth > 0.3) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(cx, cy + radius * 0.14, radius * 0.05, 2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    ctx.strokeStyle = '#a0522d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy + radius * 0.15, radius * 0.07, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // Suit jacket
  ctx.fillStyle = '#2d3748';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.38, cy + radius * 0.45);
  ctx.lineTo(cx - radius * 0.06, cy + radius * 0.47);
  ctx.lineTo(cx, cy + radius * 0.43);
  ctx.lineTo(cx + radius * 0.06, cy + radius * 0.47);
  ctx.lineTo(cx + radius * 0.38, cy + radius * 0.45);
  ctx.lineTo(cx + radius * 0.55, radius);
  ctx.lineTo(cx - radius * 0.55, radius);
  ctx.closePath();
  ctx.fill();

  // White shirt collar
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.1, cy + radius * 0.42);
  ctx.lineTo(cx - radius * 0.02, cy + radius * 0.5);
  ctx.lineTo(cx + radius * 0.02, cy + radius * 0.5);
  ctx.lineTo(cx + radius * 0.1, cy + radius * 0.42);
  ctx.closePath();
  ctx.fill();

  // Tie
  ctx.fillStyle = '#c0392b';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.04, cy + radius * 0.43);
  ctx.lineTo(cx + radius * 0.04, cy + radius * 0.43);
  ctx.lineTo(cx + radius * 0.03, cy + radius * 0.62);
  ctx.lineTo(cx, cy + radius * 0.66);
  ctx.lineTo(cx - radius * 0.03, cy + radius * 0.62);
  ctx.closePath();
  ctx.fill();
}

function drawAvatarRobot(
  ctx: CanvasRenderingContext2D,
  _cx: number, _cy: number, radius: number,
  mouth: number, anim: AnimState, t: number,
) {
  const cx = 0, cy = 0;

  // Antenna
  ctx.strokeStyle = '#636e72';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx, cy - radius * 0.56);
  ctx.lineTo(cx, cy - radius * 0.7);
  ctx.stroke();
  // Antenna tip (pulsing)
  const pulseAlpha = 0.6 + Math.sin(t * 4) * 0.4;
  ctx.fillStyle = `rgba(231, 76, 60, ${pulseAlpha})`;
  ctx.beginPath();
  ctx.arc(cx, cy - radius * 0.72, 5, 0, Math.PI * 2);
  ctx.fill();
  // Glow
  const glow = ctx.createRadialGradient(cx, cy - radius * 0.72, 2, cx, cy - radius * 0.72, 15);
  glow.addColorStop(0, `rgba(231, 76, 60, ${pulseAlpha * 0.4})`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 15, cy - radius * 0.72 - 15, 30, 30);

  // Head (metallic)
  const headGrad = ctx.createLinearGradient(cx - radius * 0.45, cy - radius * 0.56, cx + radius * 0.45, cy + radius * 0.2);
  headGrad.addColorStop(0, '#c0c9d0');
  headGrad.addColorStop(0.5, '#dfe6e9');
  headGrad.addColorStop(1, '#b2bec3');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  drawRoundedRect(ctx, cx - radius * 0.45, cy - radius * 0.56, radius * 0.9, radius * 0.76, radius * 0.12);
  ctx.fill();

  // Head border
  ctx.strokeStyle = '#636e72';
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, cx - radius * 0.45, cy - radius * 0.56, radius * 0.9, radius * 0.76, radius * 0.12);
  ctx.stroke();

  // Circuit patterns on head
  ctx.strokeStyle = `rgba(0, 206, 201, ${0.2 + Math.sin(t * 2) * 0.1})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    const lx = cx - radius * 0.35 + i * radius * 0.25;
    ctx.beginPath();
    ctx.moveTo(lx, cy - radius * 0.48);
    ctx.lineTo(lx, cy - radius * 0.4);
    ctx.lineTo(lx + radius * 0.1, cy - radius * 0.4);
    ctx.stroke();
  }

  // Eyes (LED screens)
  if (anim.isBlinking) {
    ctx.fillStyle = '#636e72';
    fillRoundedRect(ctx, cx - radius * 0.33, cy - radius * 0.32, radius * 0.24, 4, 2);
    fillRoundedRect(ctx, cx + radius * 0.09, cy - radius * 0.32, radius * 0.24, 4, 2);
  } else {
    // Screen glow
    const eyeGlow = ctx.createRadialGradient(cx - radius * 0.21, cy - radius * 0.28, 0, cx - radius * 0.21, cy - radius * 0.28, radius * 0.2);
    eyeGlow.addColorStop(0, 'rgba(0, 206, 201, 0.3)');
    eyeGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = eyeGlow;
    ctx.fillRect(cx - radius * 0.4, cy - radius * 0.45, radius * 0.38, radius * 0.34);
    const eyeGlow2 = ctx.createRadialGradient(cx + radius * 0.21, cy - radius * 0.28, 0, cx + radius * 0.21, cy - radius * 0.28, radius * 0.2);
    eyeGlow2.addColorStop(0, 'rgba(0, 206, 201, 0.3)');
    eyeGlow2.addColorStop(1, 'transparent');
    ctx.fillStyle = eyeGlow2;
    ctx.fillRect(cx + radius * 0.02, cy - radius * 0.45, radius * 0.38, radius * 0.34);

    ctx.fillStyle = '#00cec9';
    fillRoundedRect(ctx, cx - radius * 0.33, cy - radius * 0.38, radius * 0.24, radius * 0.17, 4);
    fillRoundedRect(ctx, cx + radius * 0.09, cy - radius * 0.38, radius * 0.24, radius * 0.17, 4);
    // Pupils (scanning animation)
    const scanX = Math.sin(t * 2) * radius * 0.04;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.21 + scanX, cy - radius * 0.29, radius * 0.03, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + radius * 0.21 + scanX, cy - radius * 0.29, radius * 0.03, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth panel
  if (mouth > 0.05) {
    ctx.fillStyle = '#636e72';
    fillRoundedRect(ctx, cx - radius * 0.25, cy - radius * 0.08, radius * 0.5, radius * 0.08 + mouth * radius * 0.06, 3);
    // Animated equalizer bars
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 2;
    const barCount = 7;
    for (let i = 0; i < barCount; i++) {
      const lx = cx - radius * 0.2 + i * (radius * 0.4 / (barCount - 1));
      const barH = (3 + Math.sin(i * 2.1 + t * 12) * 3) * mouth;
      ctx.beginPath();
      ctx.moveTo(lx, cy - radius * 0.04 - barH);
      ctx.lineTo(lx, cy - radius * 0.04 + barH);
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#636e72';
    fillRoundedRect(ctx, cx - radius * 0.2, cy - radius * 0.06, radius * 0.4, radius * 0.08, 3);
    ctx.strokeStyle = '#00cec9';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const lx = cx - radius * 0.15 + i * (radius * 0.3 / 4);
      ctx.beginPath();
      ctx.moveTo(lx, cy - radius * 0.04);
      ctx.lineTo(lx, cy);
      ctx.stroke();
    }
  }

  // Ear bolts
  ctx.fillStyle = '#636e72';
  ctx.beginPath();
  ctx.arc(cx - radius * 0.45, cy - radius * 0.2, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(cx + radius * 0.45, cy - radius * 0.2, 5, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyGrad = ctx.createLinearGradient(cx - radius * 0.38, cy + radius * 0.24, cx + radius * 0.38, radius);
  bodyGrad.addColorStop(0, '#74b9ff');
  bodyGrad.addColorStop(1, '#0984e3');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  drawRoundedRect(ctx, cx - radius * 0.38, cy + radius * 0.24, radius * 0.76, radius * 0.55, radius * 0.08);
  ctx.fill();
  ctx.strokeStyle = '#0984e3';
  ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, cx - radius * 0.38, cy + radius * 0.24, radius * 0.76, radius * 0.55, radius * 0.08);
  ctx.stroke();

  // Chest core (glowing)
  const coreGlow = ctx.createRadialGradient(cx, cy + radius * 0.45, 0, cx, cy + radius * 0.45, radius * 0.12);
  coreGlow.addColorStop(0, `rgba(255, 234, 167, ${0.8 + Math.sin(t * 3) * 0.2})`);
  coreGlow.addColorStop(0.5, `rgba(255, 234, 167, ${0.3 + Math.sin(t * 3) * 0.1})`);
  coreGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = coreGlow;
  ctx.beginPath();
  ctx.arc(cx, cy + radius * 0.45, radius * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffeaa7';
  ctx.beginPath();
  ctx.arc(cx, cy + radius * 0.45, radius * 0.06, 0, Math.PI * 2);
  ctx.fill();
}

function drawAvatarAnime(
  ctx: CanvasRenderingContext2D,
  _cx: number, _cy: number, radius: number,
  mouth: number, anim: AnimState, t: number,
) {
  const cx = 0, cy = 0;

  // Hair (big, colorful)
  const hairHue = 280; // purple-pink
  ctx.fillStyle = `hsl(${hairHue}, 70%, 55%)`;
  // Back hair
  ctx.beginPath();
  ctx.ellipse(cx, cy - radius * 0.15, radius * 0.65, radius * 0.7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair strands hanging down sides
  ctx.fillStyle = `hsl(${hairHue}, 65%, 50%)`;
  ctx.beginPath();
  ctx.ellipse(cx - radius * 0.5, cy + radius * 0.1, radius * 0.12, radius * 0.35, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + radius * 0.5, cy + radius * 0.1, radius * 0.12, radius * 0.35, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Face (very smooth, pointed chin)
  ctx.fillStyle = '#fde8d0';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.38, cy - radius * 0.28);
  ctx.quadraticCurveTo(cx - radius * 0.42, cy + radius * 0.08, cx - radius * 0.2, cy + radius * 0.3);
  ctx.quadraticCurveTo(cx, cy + radius * 0.42, cx + radius * 0.2, cy + radius * 0.3);
  ctx.quadraticCurveTo(cx + radius * 0.42, cy + radius * 0.08, cx + radius * 0.38, cy - radius * 0.28);
  ctx.quadraticCurveTo(cx, cy - radius * 0.48, cx - radius * 0.38, cy - radius * 0.28);
  ctx.closePath();
  ctx.fill();

  // Front hair bangs
  ctx.fillStyle = `hsl(${hairHue}, 70%, 55%)`;
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.42, cy - radius * 0.25);
  ctx.quadraticCurveTo(cx - radius * 0.3, cy - radius * 0.52, cx, cy - radius * 0.45);
  ctx.quadraticCurveTo(cx + radius * 0.3, cy - radius * 0.52, cx + radius * 0.42, cy - radius * 0.25);
  ctx.quadraticCurveTo(cx + radius * 0.2, cy - radius * 0.35, cx, cy - radius * 0.28);
  ctx.quadraticCurveTo(cx - radius * 0.2, cy - radius * 0.35, cx - radius * 0.42, cy - radius * 0.25);
  ctx.closePath();
  ctx.fill();

  // Highlight streak
  ctx.fillStyle = `hsl(${hairHue}, 75%, 70%)`;
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.1, cy - radius * 0.42);
  ctx.quadraticCurveTo(cx - radius * 0.05, cy - radius * 0.3, cx + radius * 0.02, cy - radius * 0.28);
  ctx.quadraticCurveTo(cx + radius * 0.05, cy - radius * 0.35, cx - radius * 0.1, cy - radius * 0.42);
  ctx.closePath();
  ctx.fill();

  // Eyes (very large, anime style)
  if (anim.isBlinking) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx - radius * 0.18, cy - radius * 0.06, radius * 0.1, 0.3, Math.PI - 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + radius * 0.18, cy - radius * 0.06, radius * 0.1, 0.3, Math.PI - 0.3);
    ctx.stroke();
  } else {
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx - radius * 0.18, cy - radius * 0.06, radius * 0.13, radius * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + radius * 0.18, cy - radius * 0.06, radius * 0.13, radius * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Iris (large, colorful)
    const irisGrad1 = ctx.createRadialGradient(cx - radius * 0.18, cy - radius * 0.06, 0, cx - radius * 0.18, cy - radius * 0.06, radius * 0.11);
    irisGrad1.addColorStop(0, `hsl(${hairHue + 40}, 80%, 60%)`);
    irisGrad1.addColorStop(0.6, `hsl(${hairHue + 20}, 70%, 45%)`);
    irisGrad1.addColorStop(1, `hsl(${hairHue}, 60%, 30%)`);
    ctx.fillStyle = irisGrad1;
    ctx.beginPath();
    ctx.ellipse(cx - radius * 0.18, cy - radius * 0.04, radius * 0.1, radius * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    const irisGrad2 = ctx.createRadialGradient(cx + radius * 0.18, cy - radius * 0.06, 0, cx + radius * 0.18, cy - radius * 0.06, radius * 0.11);
    irisGrad2.addColorStop(0, `hsl(${hairHue + 40}, 80%, 60%)`);
    irisGrad2.addColorStop(0.6, `hsl(${hairHue + 20}, 70%, 45%)`);
    irisGrad2.addColorStop(1, `hsl(${hairHue}, 60%, 30%)`);
    ctx.fillStyle = irisGrad2;
    ctx.beginPath();
    ctx.ellipse(cx + radius * 0.18, cy - radius * 0.04, radius * 0.1, radius * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#1a1a2e';
    ctx.beginPath();
    ctx.arc(cx - radius * 0.18, cy - radius * 0.04, radius * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + radius * 0.18, cy - radius * 0.04, radius * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Large sparkles (anime eye shine)
    ctx.fillStyle = '#fff';
    // Main shine
    ctx.beginPath();
    ctx.ellipse(cx - radius * 0.14, cy - radius * 0.1, radius * 0.035, radius * 0.04, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + radius * 0.22, cy - radius * 0.1, radius * 0.035, radius * 0.04, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Secondary shine
    ctx.beginPath();
    ctx.arc(cx - radius * 0.22, cy + radius * 0.0, radius * 0.015, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + radius * 0.14, cy + radius * 0.0, radius * 0.015, 0, Math.PI * 2);
    ctx.fill();

    // Eyelash lines (top)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx - radius * 0.18, cy - radius * 0.06, radius * 0.13, radius * 0.16, 0, Math.PI + 0.2, Math.PI * 2 - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + radius * 0.18, cy - radius * 0.06, radius * 0.13, radius * 0.16, 0, Math.PI + 0.2, Math.PI * 2 - 0.2);
    ctx.stroke();
  }

  // Eyebrows (thin, expressive)
  const browOff = -anim.browRaise * 5;
  ctx.strokeStyle = `hsl(${hairHue}, 50%, 35%)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.28, cy - radius * 0.22 + browOff);
  ctx.quadraticCurveTo(cx - radius * 0.18, cy - radius * 0.27 + browOff, cx - radius * 0.08, cy - radius * 0.23 + browOff);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.08, cy - radius * 0.23 + browOff);
  ctx.quadraticCurveTo(cx + radius * 0.18, cy - radius * 0.27 + browOff, cx + radius * 0.28, cy - radius * 0.22 + browOff);
  ctx.stroke();

  // Nose (minimal)
  ctx.fillStyle = '#f0c8a8';
  ctx.beginPath();
  ctx.arc(cx, cy + radius * 0.06, 2, 0, Math.PI * 2);
  ctx.fill();

  // Mouth
  if (mouth > 0.05) {
    // Open mouth
    ctx.fillStyle = '#e84393';
    const mh = 2 + mouth * 10;
    ctx.beginPath();
    ctx.ellipse(cx, cy + radius * 0.18, radius * 0.06 + mouth * radius * 0.02, mh, 0, 0, Math.PI * 2);
    ctx.fill();
    // Fang (anime detail)
    if (mouth > 0.35) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(cx + radius * 0.03, cy + radius * 0.15);
      ctx.lineTo(cx + radius * 0.05, cy + radius * 0.2);
      ctx.lineTo(cx + radius * 0.01, cy + radius * 0.15);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Gentle smile (cat mouth style)
    ctx.strokeStyle = '#e84393';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - radius * 0.06, cy + radius * 0.16);
    ctx.quadraticCurveTo(cx - radius * 0.02, cy + radius * 0.2, cx, cy + radius * 0.17);
    ctx.quadraticCurveTo(cx + radius * 0.02, cy + radius * 0.2, cx + radius * 0.06, cy + radius * 0.16);
    ctx.stroke();
  }

  // Blush
  ctx.fillStyle = 'rgba(255, 130, 150, 0.3)';
  ctx.beginPath();
  ctx.ellipse(cx - radius * 0.3, cy + radius * 0.08, radius * 0.07, radius * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + radius * 0.3, cy + radius * 0.08, radius * 0.07, radius * 0.04, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (school uniform style)
  ctx.fillStyle = '#2d3436';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.28, cy + radius * 0.38);
  ctx.lineTo(cx - radius * 0.5, radius);
  ctx.lineTo(cx + radius * 0.5, radius);
  ctx.lineTo(cx + radius * 0.28, cy + radius * 0.38);
  ctx.closePath();
  ctx.fill();

  // Collar
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.15, cy + radius * 0.35);
  ctx.lineTo(cx - radius * 0.28, cy + radius * 0.5);
  ctx.lineTo(cx, cy + radius * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.15, cy + radius * 0.35);
  ctx.lineTo(cx + radius * 0.28, cy + radius * 0.5);
  ctx.lineTo(cx, cy + radius * 0.45);
  ctx.closePath();
  ctx.fill();

  // Ribbon
  ctx.fillStyle = `hsl(${hairHue}, 70%, 55%)`;
  ctx.beginPath();
  ctx.moveTo(cx - radius * 0.05, cy + radius * 0.38);
  ctx.lineTo(cx - radius * 0.12, cy + radius * 0.45);
  ctx.lineTo(cx - radius * 0.02, cy + radius * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx + radius * 0.05, cy + radius * 0.38);
  ctx.lineTo(cx + radius * 0.12, cy + radius * 0.45);
  ctx.lineTo(cx + radius * 0.02, cy + radius * 0.42);
  ctx.closePath();
  ctx.fill();
}

/* ================================================================== */
/*  SUBTITLE RENDERING                                                 */
/* ================================================================== */
function drawSubtitles(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  words: string[],
  currentWordIdx: number,
  style: SubtitleStyle,
  wordsPerChunk: number,
) {
  if (words.length === 0 || currentWordIdx <= 0) return;

  const chunkStart = Math.floor((currentWordIdx - 1) / wordsPerChunk) * wordsPerChunk;
  const chunkEnd = Math.min(chunkStart + wordsPerChunk, words.length);
  const chunkWords = words.slice(chunkStart, chunkEnd);
  if (chunkWords.length === 0) return;

  const subY = h * 0.85;
  const maxWidth = w * 0.85;
  const fontSize = Math.round(w * 0.035);

  ctx.textAlign = 'center';

  if (style === 'karaoke') {
    // Karaoke: highlight the current word
    const fullText = chunkWords.join(' ');
    ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

    // Background panel
    const metrics = ctx.measureText(fullText);
    const textW = Math.min(metrics.width, maxWidth);
    const pad = 14;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    fillRoundedRect(ctx, (w - textW) / 2 - pad, subY - fontSize - 4, textW + pad * 2, fontSize + 18, 10);

    // Draw word by word
    let xOffset = (w - textW) / 2;
    ctx.textAlign = 'left';
    for (let i = 0; i < chunkWords.length; i++) {
      const wordIdx = chunkStart + i;
      const isHighlighted = wordIdx < currentWordIdx;
      ctx.fillStyle = isHighlighted ? '#f59e0b' : 'rgba(255,255,255,0.5)';
      ctx.fillText(chunkWords[i], xOffset, subY);
      xOffset += ctx.measureText(chunkWords[i] + ' ').width;
    }
    ctx.textAlign = 'center';
    return;
  }

  const text = chunkWords.join(' ');
  ctx.font = `bold ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  // Background panel
  const metrics = ctx.measureText(text);
  const textW = Math.min(metrics.width, maxWidth);
  const pad = 14;

  if (style === 'classic') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    fillRoundedRect(ctx, (w - textW) / 2 - pad, subY - fontSize - 4, textW + pad * 2, fontSize + 18, 10);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, w / 2, subY, maxWidth);
  } else if (style === 'bold') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    fillRoundedRect(ctx, (w - textW) / 2 - pad, subY - fontSize - 4, textW + pad * 2, fontSize + 18, 10);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(text, w / 2, subY, maxWidth);
  } else if (style === 'outline') {
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 4;
    ctx.strokeText(text, w / 2, subY, maxWidth);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, w / 2, subY, maxWidth);
  }

  ctx.textAlign = 'start';
}

/* ================================================================== */
/*  PARSE SCRIPT (strip pause markers, compute segments)               */
/* ================================================================== */
interface ScriptSegment {
  type: 'text' | 'pause';
  content: string;
  durationMs?: number;
}

function parseScript(rawScript: string): { segments: ScriptSegment[]; plainText: string; words: string[] } {
  const segments: ScriptSegment[] = [];
  const parts = rawScript.split(/(\[pause:\d+(?:\.\d+)?s\])/gi);
  let plainText = '';

  for (const part of parts) {
    const pauseMatch = part.match(/\[pause:(\d+(?:\.\d+)?)s\]/i);
    if (pauseMatch) {
      segments.push({ type: 'pause', content: part, durationMs: parseFloat(pauseMatch[1]) * 1000 });
    } else if (part.trim()) {
      segments.push({ type: 'text', content: part.trim() });
      plainText += (plainText ? ' ' : '') + part.trim();
    }
  }

  const words = plainText.split(/\s+/).filter(Boolean);
  return { segments, plainText, words };
}

function getWordCount(text: string): number {
  const cleaned = text.replace(/\[pause:\d+(?:\.\d+)?s\]/gi, '').trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

function getEstimatedDuration(text: string): number {
  const wc = getWordCount(text);
  const pauseMatches = text.match(/\[pause:(\d+(?:\.\d+)?)s\]/gi) || [];
  let pauseTotal = 0;
  for (const m of pauseMatches) {
    const sec = m.match(/(\d+(?:\.\d+)?)/);
    if (sec) pauseTotal += parseFloat(sec[1]);
  }
  // Average speaking rate ~150 words per minute
  return Math.ceil(wc / 2.5 + pauseTotal);
}

/* ================================================================== */
/*  RESOLUTION CONFIGS                                                 */
/* ================================================================== */
function getResolution(quality: VideoQuality, aspect: AspectRatio): [number, number] {
  const base = quality === '1080p' ? 1080 : 720;
  switch (aspect) {
    case '16:9': return quality === '1080p' ? [1920, 1080] : [1280, 720];
    case '9:16': return quality === '1080p' ? [1080, 1920] : [720, 1280];
    case '1:1': return [base, base];
    default: return [base, base];
  }
}

/* ================================================================== */
/*  DRAW FULL VIDEO FRAME                                              */
/* ================================================================== */
function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  W: number, H: number,
  t: number,
  mouthRaw: number,
  isSpeaking: boolean,
  avatarImg: HTMLImageElement | null,
  avatarStyle: AvatarStyleId,
  bgId: BackgroundId,
  anim: AnimState,
  words: string[],
  currentWordIdx: number,
  subtitleStyle: SubtitleStyle,
  dt: number,
) {
  ctx.clearRect(0, 0, W, H);

  // Update animation state
  updateAnimState(anim, dt, mouthRaw, isSpeaking);
  const mouth = anim.mouthSmooth;

  // -- Background --
  switch (bgId) {
    case 'office': drawBgOffice(ctx, W, H, t); break;
    case 'studio': drawBgStudio(ctx, W, H, t); break;
    case 'nature': drawBgNature(ctx, W, H, t, anim); break;
    case 'abstract': drawBgAbstract(ctx, W, H, t, anim); break;
    case 'transparent': drawBgTransparent(ctx, W, H); break;
  }

  // -- Avatar positioning --
  const avatarCx = W / 2;
  const avatarCy = H * 0.38;
  const avatarR = Math.min(W, H) * 0.18;

  // Glow ring
  const ringGrad = ctx.createRadialGradient(avatarCx, avatarCy, avatarR - 5, avatarCx, avatarCy, avatarR + 20);
  ringGrad.addColorStop(0, `${GRADIENT[0]}33`);
  ringGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR + 20, 0, Math.PI * 2);
  ctx.fill();

  // Breathing scale
  const breathScale = 1 + Math.sin(t * 0.8) * 0.006;
  const headX = anim.headOffsetX;
  const headY = anim.headOffsetY;

  ctx.save();
  ctx.translate(avatarCx + headX, avatarCy + headY);
  ctx.scale(breathScale, breathScale);

  // Clip to circle
  ctx.beginPath();
  ctx.arc(0, 0, avatarR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Fill background
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(0, 0, avatarR, 0, Math.PI * 2);
  ctx.fill();

  // Draw avatar based on style
  if (avatarStyle === 'photo' && avatarImg) {
    drawAvatarPhoto(ctx, avatarImg, 0, 0, avatarR, mouth, anim, t);
  } else if (avatarStyle === 'cartoon') {
    drawAvatarCartoon(ctx, 0, 0, avatarR, mouth, anim, t);
  } else if (avatarStyle === 'professional') {
    drawAvatarProfessional(ctx, 0, 0, avatarR, mouth, anim, t);
  } else if (avatarStyle === 'robot') {
    drawAvatarRobot(ctx, 0, 0, avatarR, mouth, anim, t);
  } else if (avatarStyle === 'anime') {
    drawAvatarAnime(ctx, 0, 0, avatarR, mouth, anim, t);
  } else if (avatarImg) {
    // Fallback: just draw uploaded image
    drawAvatarPhoto(ctx, avatarImg, 0, 0, avatarR, mouth, anim, t);
  } else {
    // Fallback to professional
    drawAvatarProfessional(ctx, 0, 0, avatarR, mouth, anim, t);
  }

  ctx.restore();

  // Avatar circle border
  ctx.strokeStyle = `${GRADIENT[0]}88`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarCx + headX, avatarCy + headY, avatarR * breathScale + 2, 0, Math.PI * 2);
  ctx.stroke();

  // -- Name plate --
  const styleName = AVATAR_STYLES.find((s) => s.id === avatarStyle)?.name ?? 'Avatar';
  const nameText = (avatarStyle === 'photo' && avatarImg) ? 'AI Presenter' : styleName;
  ctx.font = `bold ${Math.round(W * 0.028)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = bgId === 'transparent' ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)';
  ctx.fillText(nameText, avatarCx, avatarCy + avatarR + W * 0.04);

  // -- Audio level bars --
  if (mouth > 0.02 && isSpeaking) {
    const barsX = avatarCx;
    const barsY = avatarCy + avatarR + W * 0.06;
    const barCount = 5;
    const barSpacing = 8;
    const startX = barsX - ((barCount - 1) * barSpacing) / 2;
    for (let i = 0; i < barCount; i++) {
      const bh = 4 + Math.sin(t * 12 + i * 1.5) * mouth * 12;
      const alphaHex = Math.round(150 + mouth * 100).toString(16).padStart(2, '0');
      ctx.fillStyle = `${GRADIENT[0]}${alphaHex}`;
      fillRoundedRect(ctx, startX + i * barSpacing - 2, barsY - bh / 2, 4, Math.max(bh, 2), 2);
    }
  }

  // -- Subtitles --
  drawSubtitles(ctx, W, H, words, currentWordIdx, subtitleStyle, 6);

  // -- Watermark --
  ctx.font = `bold ${Math.round(W * 0.018)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = bgId === 'transparent' ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)';
  ctx.fillText('Made with TubeForge', W / 2, H - W * 0.04);
  ctx.textAlign = 'start';
}


/* ================================================================== */
/*  MAIN COMPONENT                                                     */
/* ================================================================== */
export function AiCreator() {
  const C = useThemeStore((s) => s.theme);

  /* Wizard step: 1=avatar, 2=script, 3=voice, 4=settings, 5=generate/preview */
  const [step, setStep] = useState(1);

  /* Step 1 - avatar */
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<AvatarStyleId>('professional');
  const [selectedBg, setSelectedBg] = useState<BackgroundId>('studio');
  const [hoveredStyle, setHoveredStyle] = useState<string | null>(null);
  const [hoveredBg, setHoveredBg] = useState<string | null>(null);

  /* Step 2 - script */
  const [script, setScript] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<ScriptCategory | null>(null);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  /* Step 3 - voice */
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [hoveredVoice, setHoveredVoice] = useState<string | null>(null);

  /* Step 4 - settings */
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('classic');
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('720p');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');

  /* Step 5 - generation & preview */
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animFrameRef = useRef<number>(0);
  const abortRef = useRef(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  /* Misc UI */
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  /* ---------------------------------------------------------------- */
  /*  Load browser TTS voices                                         */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    function loadVoices() {
      const v = window.speechSynthesis?.getVoices() ?? [];
      if (v.length > 0) {
        setVoices(v);
        const eng = v.find((x) => x.lang.startsWith('en'));
        if (eng) setSelectedVoiceUri(eng.voiceURI);
        else setSelectedVoiceUri(v[0].voiceURI);
      }
    }
    loadVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Photo URL management                                            */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    if (!photo) { setPhotoUrl(null); return; }
    const url = URL.createObjectURL(photo);
    setPhotoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [photo]);

  /* ---------------------------------------------------------------- */
  /*  Script template generation                                      */
  /* ---------------------------------------------------------------- */
  const handleTemplateSelect = useCallback((cat: ScriptCategory) => {
    setSelectedTemplate(cat);
    setIsGeneratingScript(true);
    setTimeout(() => {
      const template = SCRIPT_TEMPLATES.find((t) => t.category === cat);
      if (template) setScript(template.body);
      setIsGeneratingScript(false);
    }, 500);
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Load avatar image for rendering                                 */
  /* ---------------------------------------------------------------- */
  const getAvatarImage = useCallback((): Promise<HTMLImageElement | null> => {
    return new Promise((resolve) => {
      if (photoUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = photoUrl;
      } else {
        resolve(null);
      }
    });
  }, [photoUrl]);

  /* ---------------------------------------------------------------- */
  /*  Main generation pipeline                                        */
  /* ---------------------------------------------------------------- */
  const handleCreate = useCallback(async () => {
    if (generating) return;
    setGenerating(true);
    setProgress(0);
    setError('');
    setStatusText('Preparing...');
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }
    abortRef.current = false;

    try {
      setStatusText('Loading avatar...');
      setProgress(5);

      const avatarImg = await getAvatarImage();

      if (selectedStyle === 'photo' && !avatarImg) {
        throw new Error('Photo Realistic style requires an uploaded photo. Go back and upload one, or choose a different style.');
      }

      if (abortRef.current) return;

      setStatusText('Parsing script...');
      setProgress(10);

      const { segments, plainText, words } = parseScript(script);
      if (words.length === 0) {
        throw new Error('Script is empty. Go back and write a script.');
      }

      const [WIDTH, HEIGHT] = getResolution(videoQuality, aspectRatio);

      const canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d')!;

      if (canvasRef.current) {
        canvasRef.current.width = WIDTH;
        canvasRef.current.height = HEIGHT;
      }

      const anim = createAnimState(WIDTH, HEIGHT);

      setStatusText('Starting recording...');
      setProgress(15);

      const stream = canvas.captureStream(30);
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

      const bitrate = videoQuality === '1080p' ? 5_000_000 : 2_500_000;
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: bitrate });
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: 'video/webm' }));
      });
      recorder.start(100);

      setStatusText('Generating video with narration...');
      setProgress(20);

      /* Process segments with pauses */
      window.speechSynthesis.cancel();

      let currentWordIndex = 0;
      let ttsFinished = false;
      const wordTimestamps: number[] = [];
      const startTime = performance.now();
      let lastFrameTime = performance.now();

      // We need to process text segments and pause segments sequentially
      const textSegments = segments.filter((s) => s.type === 'text');
      const textOnly = textSegments.map((s) => s.content).join(' ');

      const utterance = new SpeechSynthesisUtterance(textOnly);
      const voice = voices.find((v) => v.voiceURI === selectedVoiceUri);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.pitch = 1;

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          wordTimestamps.push(performance.now());
          currentWordIndex = wordTimestamps.length;
        }
      };

      const ttsPromise = new Promise<void>((resolve) => {
        utterance.onend = () => { ttsFinished = true; resolve(); };
        utterance.onerror = () => { ttsFinished = true; resolve(); };
      });

      window.speechSynthesis.speak(utterance);

      /* Animation loop */
      const animationDone = new Promise<void>((resolve) => {
        function draw() {
          if (abortRef.current) { resolve(); return; }

          const now = performance.now();
          const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
          lastFrameTime = now;
          const elapsed = (now - startTime) / 1000;

          // Estimate word index if boundary events not firing
          if (wordTimestamps.length === 0 && elapsed > 0.5 && !ttsFinished) {
            currentWordIndex = Math.min(Math.floor(elapsed * 3), words.length);
          }

          // Compute mouth open level
          const recentWords = wordTimestamps.filter((ts) => now - ts < 200).length;
          let mouthLevel = ttsFinished ? 0 : Math.min(recentWords * 0.35 + 0.15, 1);
          if (!ttsFinished && wordTimestamps.length === 0 && elapsed > 0.5) {
            mouthLevel = 0.3 + Math.sin(elapsed * 8) * 0.25 + Math.sin(elapsed * 5.3) * 0.15;
            mouthLevel = Math.max(0, Math.min(1, mouthLevel));
          }
          mouthLevel *= 0.7 + Math.sin(now / 1000 * 12) * 0.3;

          drawVideoFrame(
            ctx, WIDTH, HEIGHT, elapsed,
            ttsFinished ? 0 : mouthLevel,
            !ttsFinished,
            avatarImg, selectedStyle, selectedBg, anim,
            words, currentWordIndex, subtitleStyle, dt,
          );

          // Mirror to visible canvas
          if (canvasRef.current) {
            const visCtx = canvasRef.current.getContext('2d');
            if (visCtx) {
              visCtx.clearRect(0, 0, WIDTH, HEIGHT);
              visCtx.drawImage(canvas, 0, 0);
            }
          }

          if (!ttsFinished) {
            const p = 20 + (currentWordIndex / Math.max(words.length, 1)) * 65;
            setProgress(Math.min(p, 88));
          }

          if (!ttsFinished && elapsed < 600 && !abortRef.current) {
            animFrameRef.current = requestAnimationFrame(draw);
          } else {
            resolve();
          }
        }
        animFrameRef.current = requestAnimationFrame(draw);
      });

      await Promise.all([ttsPromise, animationDone]);

      if (abortRef.current) { recorder.stop(); return; }

      // Process pause segments - just draw idle frames
      let totalPauseMs = 0;
      for (const seg of segments) {
        if (seg.type === 'pause' && seg.durationMs) {
          totalPauseMs += seg.durationMs;
        }
      }

      if (totalPauseMs > 0) {
        setStatusText('Processing pauses...');
        const pauseStart = performance.now();
        await new Promise<void>((resolve) => {
          function pauseFrames() {
            const now = performance.now();
            const elapsed = (now - startTime) / 1000;
            const pe = now - pauseStart;
            const dt = 1 / 30;
            drawVideoFrame(
              ctx, WIDTH, HEIGHT, elapsed,
              0, false, avatarImg, selectedStyle, selectedBg, anim,
              words, words.length, subtitleStyle, dt,
            );
            if (canvasRef.current) {
              const visCtx = canvasRef.current.getContext('2d');
              if (visCtx) {
                visCtx.clearRect(0, 0, WIDTH, HEIGHT);
                visCtx.drawImage(canvas, 0, 0);
              }
            }
            if (pe < totalPauseMs && !abortRef.current) {
              requestAnimationFrame(pauseFrames);
            } else {
              resolve();
            }
          }
          requestAnimationFrame(pauseFrames);
        });
      }

      if (abortRef.current) { recorder.stop(); return; }

      // Ending frames
      setStatusText('Finalizing...');
      setProgress(90);

      const endStart = performance.now();
      await new Promise<void>((resolve) => {
        function endFrames() {
          const now = performance.now();
          const elapsed = (now - startTime) / 1000;
          const fe = (now - endStart) / 1000;
          const dt = 1 / 30;

          drawVideoFrame(
            ctx, WIDTH, HEIGHT, elapsed,
            0, false, avatarImg, selectedStyle, selectedBg, anim,
            words, words.length, subtitleStyle, dt,
          );

          // Fade in end text
          const alpha = Math.min(1, fe / 0.5);
          const endFontSize = Math.round(WIDTH * 0.04);
          ctx.font = `bold ${endFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.textAlign = 'center';
          const textColor = selectedBg === 'transparent' ? `rgba(0,0,0,${alpha * 0.8})` : `rgba(255,255,255,${alpha * 0.9})`;
          ctx.fillStyle = textColor;
          ctx.fillText('Thanks for watching!', WIDTH / 2, HEIGHT * 0.78);
          ctx.font = `${Math.round(WIDTH * 0.022)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = selectedBg === 'transparent' ? `rgba(0,0,0,${alpha * 0.4})` : `rgba(255,255,255,${alpha * 0.5})`;
          ctx.fillText('Made with TubeForge', WIDTH / 2, HEIGHT * 0.78 + endFontSize * 1.4);
          ctx.textAlign = 'start';

          if (canvasRef.current) {
            const visCtx = canvasRef.current.getContext('2d');
            if (visCtx) {
              visCtx.clearRect(0, 0, WIDTH, HEIGHT);
              visCtx.drawImage(canvas, 0, 0);
            }
          }

          if (fe < 1.5 && !abortRef.current) {
            requestAnimationFrame(endFrames);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(endFrames);
      });

      setStatusText('Encoding video...');
      setProgress(95);
      recorder.stop();
      const videoBlob = await recordingDone;

      if (abortRef.current) return;

      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setProgress(100);
      setStatusText('Done! Your video is ready.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred during video generation.';
      setError(msg);
      setStatusText('');
      window.speechSynthesis?.cancel();
    } finally {
      setGenerating(false);
    }
  }, [
    generating, script, voices, selectedVoiceUri,
    photoUrl, selectedStyle, selectedBg, videoUrl,
    getAvatarImage, videoQuality, aspectRatio, subtitleStyle,
  ]);

  /* ---------------------------------------------------------------- */
  /*  Download                                                        */
  /* ---------------------------------------------------------------- */
  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `ai-avatar-${aspectRatio.replace(':', 'x')}-${videoQuality}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [videoUrl, aspectRatio, videoQuality]);

  /* ---------------------------------------------------------------- */
  /*  Cancel                                                          */
  /* ---------------------------------------------------------------- */
  const handleCancel = useCallback(() => {
    abortRef.current = true;
    window.speechSynthesis?.cancel();
    cancelAnimationFrame(animFrameRef.current);
    setGenerating(false);
    setStatusText('Cancelled.');
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Navigation                                                      */
  /* ---------------------------------------------------------------- */
  const canAdvance = useMemo(() => {
    if (step === 1) return (selectedStyle === 'photo' ? photo !== null : true);
    if (step === 2) return script.trim().length > 0;
    if (step === 3) return !!selectedVoiceUri;
    if (step === 4) return true;
    return false;
  }, [step, photo, selectedStyle, script, selectedVoiceUri]);

  const handleStartOver = useCallback(() => {
    window.speechSynthesis?.cancel();
    cancelAnimationFrame(animFrameRef.current);
    abortRef.current = true;
    setStep(1);
    setPhoto(null);
    setPhotoUrl(null);
    setSelectedStyle('professional');
    setSelectedBg('studio');
    setScript('');
    setSelectedTemplate(null);
    setSubtitleStyle('classic');
    setVideoQuality('720p');
    setAspectRatio('1:1');
    setGenerating(false);
    setProgress(0);
    setStatusText('');
    setError('');
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
  }, [videoUrl]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const displayVoices = useMemo(() => {
    const english = voices.filter((v) => v.lang.startsWith('en'));
    const list = english.length > 0 ? english : voices;
    return list.slice(0, 12);
  }, [voices]);

  const wordCount = useMemo(() => getWordCount(script), [script]);
  const estDuration = useMemo(() => getEstimatedDuration(script), [script]);

  const stepLabels = ['Avatar & Scene', 'Write Script', 'Select Voice', 'Settings', 'Create Video'];

  /* ================================================================ */
  /*  HELPER: small reusable UI components                             */
  /* ================================================================ */
  const SectionCard = useCallback(({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
    <div style={{ padding: 16, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card, marginBottom: 0 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: subtitle ? 4 : 14, wordBreak: 'break-word' }}>{title}</span>
      {subtitle && <span style={{ fontSize: 12, color: C.dim, display: 'block', marginBottom: 14, wordBreak: 'break-word' }}>{subtitle}</span>}
      {children}
    </div>
  ), [C]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  return (
    <ToolPageShell
      title="AI Avatar Video Creator"
      subtitle="Create professional talking-head avatar videos with text-to-speech"
      gradient={GRADIENT}
    >
      {/* ---- Progress Steps ---- */}
      <div style={{
        padding: 16, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card,
        marginBottom: 24, overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 480 }}>
          {stepLabels.map((label, i) => {
            const stepNum = i + 1;
            const isActive = step === stepNum;
            const isComplete = step > stepNum;
            return (
              <div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: isComplete
                      ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                      : isActive ? `${GRADIENT[0]}22` : C.surface,
                    border: `2px solid ${isComplete || isActive ? GRADIENT[0] : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isComplete ? '#fff' : isActive ? GRADIENT[0] : C.dim,
                    fontSize: 12, fontWeight: 700, transition: 'all 0.3s ease',
                  }}>
                    {isComplete ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : stepNum}
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: isActive ? 700 : 500,
                    color: isActive ? C.text : C.dim, whiteSpace: 'nowrap',
                  }}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 8px',
                    background: isComplete ? GRADIENT[0] : C.border,
                    borderRadius: 1, transition: 'background 0.3s ease',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
        {/* ================================================================ */}
        {/*  LEFT: Step content                                              */}
        {/* ================================================================ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ---- STEP 1: Avatar & Scene ---- */}
          {step === 1 && (
            <>
              {/* Avatar Style Selection */}
              <SectionCard title="Avatar Style" subtitle="Choose how your avatar looks">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                  {AVATAR_STYLES.map((style) => {
                    const isSelected = selectedStyle === style.id;
                    const isHov = hoveredStyle === style.id;
                    return (
                      <button
                        key={style.id}
                        onClick={() => {
                          setSelectedStyle(style.id);
                          if (style.id !== 'photo') setPhoto(null);
                        }}
                        onMouseEnter={() => setHoveredStyle(style.id)}
                        onMouseLeave={() => setHoveredStyle(null)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '14px 8px', borderRadius: 12, minHeight: 44,
                          border: `2px solid ${isSelected ? style.color : isHov ? `${style.color}88` : C.border}`,
                          background: isSelected ? `${style.color}15` : isHov ? `${style.color}08` : C.surface,
                          cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                          outline: 'none',
                        }}
                      >
                        <div style={{
                          width: 40, height: 40, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${style.color}, ${style.color}aa)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 16, fontWeight: 700,
                        }}>
                          {style.id === 'photo' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                          ) : style.id === 'cartoon' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
                          ) : style.id === 'professional' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          ) : style.id === 'robot' ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2l2.09 6.26L20.36 10l-6.27 2.09L12 18.36l-2.09-6.27L3.64 10l6.27-2.09L12 2z" /></svg>
                          )}
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: isSelected ? style.color : C.sub, textAlign: 'center',
                        }}>{style.name}</span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Photo upload (only for Photo Realistic style) */}
              {selectedStyle === 'photo' && (
                <SectionCard title="Upload Photo" subtitle="Upload a face photo for the avatar">
                  {!photo ? (
                    <UploadArea C={C} accept="image/*" onFile={(f) => setPhoto(f)} label="Drop a photo or click to upload" />
                  ) : (
                    <div style={{
                      padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface,
                      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                    }}>
                      {photoUrl && (
                        <img src={photoUrl} alt="Avatar" style={{
                          width: 56, height: 56, borderRadius: 12, objectFit: 'cover',
                        }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.name}</div>
                        <div style={{ fontSize: 11, color: C.dim }}>{(photo.size / 1024).toFixed(0)} KB</div>
                      </div>
                      <button
                        onClick={() => setPhoto(null)}
                        style={{
                          padding: '5px 12px', borderRadius: 8, border: `1px solid ${C.border}`,
                          background: C.surface, color: C.sub, fontSize: 11, fontWeight: 600,
                          cursor: 'pointer', fontFamily: 'inherit', outline: 'none', flexShrink: 0,
                          minHeight: 44,
                        }}
                      >Remove</button>
                    </div>
                  )}
                </SectionCard>
              )}

              {/* Scene Background */}
              <SectionCard title="Scene Background" subtitle="Choose the background for your video">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                  {BACKGROUNDS.map((bg) => {
                    const isSelected = selectedBg === bg.id;
                    const isHov = hoveredBg === bg.id;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => setSelectedBg(bg.id)}
                        onMouseEnter={() => setHoveredBg(bg.id)}
                        onMouseLeave={() => setHoveredBg(null)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                          padding: '12px 6px', borderRadius: 10, minHeight: 44,
                          border: `2px solid ${isSelected ? bg.color : isHov ? `${bg.color}88` : C.border}`,
                          background: isSelected ? `${bg.color}15` : isHov ? `${bg.color}08` : C.surface,
                          cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                          outline: 'none',
                        }}
                      >
                        <div style={{
                          width: 36, height: 24, borderRadius: 4,
                          background: bg.id === 'transparent'
                            ? 'repeating-conic-gradient(#ccc 0% 25%, #999 0% 50%) 50%/10px 10px'
                            : bg.id === 'office' ? 'linear-gradient(135deg, #e8e0d4, #8b7355)'
                            : bg.id === 'studio' ? 'linear-gradient(135deg, #0a0a12, #1e1b4b)'
                            : bg.id === 'nature' ? 'linear-gradient(135deg, #56b4f5, #4caf50)'
                            : 'linear-gradient(135deg, #a855f7, #ec4899)',
                        }} />
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: isSelected ? bg.color : C.sub,
                        }}>{bg.name}</span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            </>
          )}

          {/* ---- STEP 2: Script ---- */}
          {step === 2 && (
            <>
              <SectionCard title="Write Your Script" subtitle="Type your script or use an AI template. Use [pause:2s] for pauses.">
                <textarea
                  value={script}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_SCRIPT_CHARS) setScript(e.target.value);
                  }}
                  placeholder="Type what the avatar should say... Use [pause:2s] to insert pauses."
                  style={{
                    width: '100%', minHeight: 200, padding: 14, borderRadius: 12,
                    border: `1px solid ${C.border}`, background: C.surface,
                    color: C.text, fontSize: 14, fontFamily: 'inherit',
                    resize: 'vertical', outline: 'none', lineHeight: 1.6,
                    transition: 'border-color 0.2s ease', boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: C.dim }}>
                      {wordCount} words
                    </span>
                    <span style={{ fontSize: 12, color: C.dim }}>
                      ~{estDuration}s duration
                    </span>
                  </div>
                  <span style={{
                    fontSize: 12,
                    color: script.length > MAX_SCRIPT_CHARS * 0.9 ? '#ef4444' : C.dim,
                  }}>
                    {script.length} / {MAX_SCRIPT_CHARS}
                  </span>
                </div>
              </SectionCard>

              {/* Script Templates */}
              <SectionCard title="Script Templates" subtitle="Quick-start with a template by category">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {SCRIPT_TEMPLATES.map((tmpl) => {
                    const isSelected = selectedTemplate === tmpl.category;
                    const isHov = hoveredBtn === `tmpl-${tmpl.category}`;
                    return (
                      <button
                        key={tmpl.category}
                        onClick={() => handleTemplateSelect(tmpl.category)}
                        onMouseEnter={() => setHoveredBtn(`tmpl-${tmpl.category}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        disabled={isGeneratingScript}
                        style={{
                          padding: '10px 8px', borderRadius: 10, minHeight: 44,
                          border: `1px solid ${isSelected ? GRADIENT[0] : isHov ? `${GRADIENT[0]}66` : C.border}`,
                          background: isSelected ? `${GRADIENT[0]}15` : isHov ? `${GRADIENT[0]}08` : C.surface,
                          cursor: isGeneratingScript ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease', fontFamily: 'inherit',
                          outline: 'none', textAlign: 'center',
                          opacity: isGeneratingScript ? 0.6 : 1,
                        }}
                      >
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: isSelected ? GRADIENT[0] : C.sub,
                        }}>{tmpl.name}</span>
                      </button>
                    );
                  })}
                </div>
                {isGeneratingScript && (
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg width="14" height="14" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" stroke={GRADIENT[0]} strokeWidth="2" fill="none" opacity={0.3} />
                      <path d="M8 2a6 6 0 014.47 2" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                    <span style={{ fontSize: 12, color: GRADIENT[0], fontWeight: 600 }}>Loading template...</span>
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {/* ---- STEP 3: Voice ---- */}
          {step === 3 && (
            <SectionCard title="Select TTS Voice" subtitle="Choose a voice for the avatar speech (browser SpeechSynthesis)">
              {displayVoices.length === 0 ? (
                <div style={{
                  padding: 24, textAlign: 'center', borderRadius: 12,
                  border: `1px dashed ${C.border}`, background: C.surface,
                }}>
                  <span style={{ fontSize: 13, color: C.dim }}>
                    Loading voices... If none appear, your browser may not support SpeechSynthesis.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                  {displayVoices.map((v, idx) => {
                    const isSelected = selectedVoiceUri === v.voiceURI;
                    const isHov = hoveredVoice === v.voiceURI;
                    const hue = (idx * 37) % 360;
                    const clr = `hsl(${hue}, 65%, 55%)`;
                    return (
                      <button
                        key={v.voiceURI}
                        onClick={() => setSelectedVoiceUri(v.voiceURI)}
                        onMouseEnter={() => setHoveredVoice(v.voiceURI)}
                        onMouseLeave={() => setHoveredVoice(null)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                          borderRadius: 10, minHeight: 44,
                          border: `1px solid ${isSelected ? clr : isHov ? `${clr}88` : C.border}`,
                          background: isSelected ? `${clr}15` : isHov ? `${clr}08` : C.surface,
                          cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                          textAlign: 'left', outline: 'none',
                        }}
                      >
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${clr}, ${clr}aa)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
                        }}>
                          {v.name.charAt(0).toUpperCase()}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 12, fontWeight: 600, color: C.text,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{v.name}</div>
                          <div style={{ fontSize: 10, color: C.dim }}>{v.lang}{v.default ? ' (default)' : ''}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {/* Test voice */}
              <div style={{ marginTop: 14 }}>
                <button
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance('Hello! This is a preview of the selected voice.');
                    const v = voices.find((x) => x.voiceURI === selectedVoiceUri);
                    if (v) u.voice = v;
                    window.speechSynthesis.speak(u);
                  }}
                  onMouseEnter={() => setHoveredBtn('test-voice')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    padding: '8px 18px', borderRadius: 10, minHeight: 44,
                    border: `1px solid ${GRADIENT[0]}55`,
                    background: hoveredBtn === 'test-voice' ? `${GRADIENT[0]}22` : `${GRADIENT[0]}11`,
                    color: GRADIENT[0], fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.2s ease', outline: 'none',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19" />
                    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" />
                  </svg>
                  Test Voice
                </button>
              </div>
            </SectionCard>
          )}

          {/* ---- STEP 4: Settings ---- */}
          {step === 4 && (
            <>
              {/* Subtitle Style */}
              <SectionCard title="Subtitle Style" subtitle="Choose how subtitles appear in the video">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                  {SUBTITLE_STYLES.map((ss) => {
                    const isSelected = subtitleStyle === ss.id;
                    const isHov = hoveredBtn === `sub-${ss.id}`;
                    return (
                      <button
                        key={ss.id}
                        onClick={() => setSubtitleStyle(ss.id)}
                        onMouseEnter={() => setHoveredBtn(`sub-${ss.id}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          padding: '10px 6px', borderRadius: 10, minHeight: 44,
                          border: `2px solid ${isSelected ? GRADIENT[0] : isHov ? `${GRADIENT[0]}66` : C.border}`,
                          background: isSelected ? `${GRADIENT[0]}15` : isHov ? `${GRADIENT[0]}08` : C.surface,
                          cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                          outline: 'none',
                        }}
                      >
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: isSelected ? GRADIENT[0] : C.sub,
                        }}>{ss.name}</span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Video Quality */}
              <SectionCard title="Video Quality">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(['720p', '1080p'] as VideoQuality[]).map((q) => {
                    const isSelected = videoQuality === q;
                    const isHov = hoveredBtn === `q-${q}`;
                    return (
                      <button
                        key={q}
                        onClick={() => setVideoQuality(q)}
                        onMouseEnter={() => setHoveredBtn(`q-${q}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          flex: '1 1 120px', padding: '12px 10px', borderRadius: 10, minHeight: 44,
                          border: `2px solid ${isSelected ? GRADIENT[0] : isHov ? `${GRADIENT[0]}66` : C.border}`,
                          background: isSelected ? `${GRADIENT[0]}15` : isHov ? `${GRADIENT[0]}08` : C.surface,
                          cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                          outline: 'none', textAlign: 'center',
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, color: isSelected ? GRADIENT[0] : C.text, display: 'block' }}>
                          {q}
                        </span>
                        <span style={{ fontSize: 10, color: C.dim, wordBreak: 'break-word' }}>
                          {q === '720p' ? '1280x720 / Faster' : '1920x1080 / Higher Quality'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>

              {/* Aspect Ratio */}
              <SectionCard title="Aspect Ratio">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ar) => {
                    const isSelected = aspectRatio === ar;
                    const isHov = hoveredBtn === `ar-${ar}`;
                    const dims = getResolution(videoQuality, ar);
                    return (
                      <button
                        key={ar}
                        onClick={() => setAspectRatio(ar)}
                        onMouseEnter={() => setHoveredBtn(`ar-${ar}`)}
                        onMouseLeave={() => setHoveredBtn(null)}
                        style={{
                          flex: '1 1 80px', padding: '12px 10px', borderRadius: 10, minHeight: 44,
                          border: `2px solid ${isSelected ? GRADIENT[0] : isHov ? `${GRADIENT[0]}66` : C.border}`,
                          background: isSelected ? `${GRADIENT[0]}15` : isHov ? `${GRADIENT[0]}08` : C.surface,
                          cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                          outline: 'none', textAlign: 'center',
                        }}
                      >
                        {/* Aspect ratio visual indicator */}
                        <div style={{
                          margin: '0 auto 6px',
                          width: ar === '16:9' ? 36 : ar === '9:16' ? 20 : 28,
                          height: ar === '16:9' ? 20 : ar === '9:16' ? 36 : 28,
                          borderRadius: 3,
                          border: `2px solid ${isSelected ? GRADIENT[0] : C.dim}`,
                        }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? GRADIENT[0] : C.text, display: 'block' }}>
                          {ar}
                        </span>
                        <span style={{ fontSize: 10, color: C.dim }}>
                          {dims[0]}x{dims[1]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </SectionCard>
            </>
          )}

          {/* ---- STEP 5: Generate & Preview ---- */}
          {step === 5 && (
            <SectionCard title="Create AI Video" subtitle="Review your settings and generate the video.">
              {/* Summary */}
              <div style={{
                padding: 14, borderRadius: 12, background: C.surface,
                border: `1px solid ${C.border}`, marginBottom: 16,
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8,
              }}>
                <div style={{ fontSize: 12, color: C.dim }}>
                  <span style={{ fontWeight: 600, color: C.sub }}>Style:</span>{' '}
                  {AVATAR_STYLES.find((s) => s.id === selectedStyle)?.name}
                </div>
                <div style={{ fontSize: 12, color: C.dim }}>
                  <span style={{ fontWeight: 600, color: C.sub }}>Background:</span>{' '}
                  {BACKGROUNDS.find((b) => b.id === selectedBg)?.name}
                </div>
                <div style={{ fontSize: 12, color: C.dim }}>
                  <span style={{ fontWeight: 600, color: C.sub }}>Voice:</span>{' '}
                  {voices.find((v) => v.voiceURI === selectedVoiceUri)?.name ?? 'Default'}
                </div>
                <div style={{ fontSize: 12, color: C.dim }}>
                  <span style={{ fontWeight: 600, color: C.sub }}>Quality:</span>{' '}
                  {videoQuality} ({aspectRatio})
                </div>
                <div style={{ fontSize: 12, color: C.dim, gridColumn: '1 / -1', wordBreak: 'break-word' }}>
                  <span style={{ fontWeight: 600, color: C.sub }}>Script:</span>{' '}
                  {wordCount} words, ~{estDuration}s — &quot;{script.slice(0, 80)}{script.length > 80 ? '...' : ''}&quot;
                </div>
                <div style={{ fontSize: 12, color: C.dim }}>
                  <span style={{ fontWeight: 600, color: C.sub }}>Subtitles:</span>{' '}
                  {SUBTITLE_STYLES.find((s) => s.id === subtitleStyle)?.name}
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: 10, marginBottom: 14,
                  background: `${C.red}12`,
                  border: `1px solid ${C.red}30`,
                  color: C.red, fontSize: 13, fontWeight: 500, wordBreak: 'break-word',
                }}>
                  {error}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {!videoUrl && (
                  <ActionButton
                    label={generating ? 'Generating Video...' : 'Create AI Video'}
                    gradient={GRADIENT}
                    onClick={handleCreate}
                    disabled={generating}
                    loading={generating}
                  />
                )}
                {generating && (
                  <button
                    onClick={handleCancel}
                    style={{
                      padding: '12px 20px', borderRadius: 12, minHeight: 44,
                      border: `1px solid ${C.border}`, background: C.card,
                      color: C.text, fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.2s ease', outline: 'none',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.surface; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
                  >
                    Cancel
                  </button>
                )}
                {videoUrl && (
                  <>
                    <button
                      onClick={handleDownload}
                      onMouseEnter={() => setHoveredBtn('dl')}
                      onMouseLeave={() => setHoveredBtn(null)}
                      style={{
                        padding: '12px 24px', borderRadius: 12, border: 'none', minHeight: 44,
                        background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                        color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.2s ease', outline: 'none',
                        boxShadow: `0 4px 16px ${GRADIENT[0]}33`,
                        transform: hoveredBtn === 'dl' ? 'translateY(-1px)' : 'none',
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download Video
                    </button>
                    <button
                      onClick={() => {
                        if (videoUrl) URL.revokeObjectURL(videoUrl);
                        setVideoUrl(null);
                        setProgress(0);
                        setStatusText('');
                        setError('');
                      }}
                      onMouseEnter={() => setHoveredBtn('new-video')}
                      onMouseLeave={() => setHoveredBtn(null)}
                      style={{
                        padding: '12px 18px', borderRadius: 12, border: `1px solid ${C.border}`, minHeight: 44,
                        background: hoveredBtn === 'new-video' ? C.surface : C.card,
                        color: C.sub, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'inherit', transition: 'all 0.2s ease', outline: 'none',
                      }}
                    >
                      Generate New Video
                    </button>
                  </>
                )}
              </div>
            </SectionCard>
          )}

          {/* ---- Navigation ---- */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' }}>
            {step > 1 && (
              <button
                onClick={() => {
                  handleCancel();
                  setStep(step - 1);
                }}
                onMouseEnter={() => setHoveredBtn('back')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: '12px 24px', borderRadius: 12, minHeight: 44,
                  border: `1px solid ${C.border}`,
                  background: hoveredBtn === 'back' ? C.surface : C.card,
                  color: C.text, fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                  outline: 'none',
                }}
              >
                Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < 5 && (
              <button
                onClick={() => {
                  if (canAdvance) setStep(step + 1);
                }}
                disabled={!canAdvance}
                onMouseEnter={() => setHoveredBtn('next')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none', minHeight: 44,
                  background: canAdvance
                    ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                    : '#555',
                  color: '#fff', fontSize: 14, fontWeight: 700,
                  cursor: canAdvance ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s ease', fontFamily: 'inherit',
                  boxShadow: canAdvance ? `0 4px 16px ${GRADIENT[0]}33` : 'none',
                  transform: canAdvance && hoveredBtn === 'next' ? 'translateY(-1px)' : 'none',
                  outline: 'none',
                }}
              >
                Next Step
              </button>
            )}
            {step > 1 && (
              <button
                onClick={handleStartOver}
                onMouseEnter={() => setHoveredBtn('startover')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: '12px 18px', borderRadius: 12, minHeight: 44,
                  border: `1px solid ${C.border}`,
                  background: hoveredBtn === 'startover' ? C.surface : C.card,
                  color: C.dim, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'all 0.2s ease', fontFamily: 'inherit', outline: 'none',
                }}
              >
                Start Over
              </button>
            )}
          </div>
        </div>

        {/* ================================================================ */}
        {/*  RIGHT: Preview area                                             */}
        {/* ================================================================ */}
        <div style={{
          padding: 16, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Preview</span>
            {generating && (
              <span style={{
                padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                background: '#ef444422', color: '#ef4444',
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
                  animation: 'pulse 1s infinite',
                }} />
                RECORDING
              </span>
            )}
          </div>

          {/* Progress bar */}
          {(generating || progress > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              <div style={{
                width: '100%', height: 6, borderRadius: 3,
                background: C.surface, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  background: `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                  width: `${progress}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 500, wordBreak: 'break-word', minWidth: 0 }}>
                  {statusText}
                </span>
                <span style={{ fontSize: 12, color: C.dim, fontWeight: 600, flexShrink: 0 }}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          )}

          {/* Preview area */}
          <div style={{
            flex: 1, minHeight: 250, borderRadius: 14,
            border: `1px solid ${C.border}`, background: '#1a1a2e',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Completed video */}
            {videoUrl && !generating && (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            )}

            {/* Live canvas */}
            <canvas
              ref={canvasRef}
              width={720}
              height={720}
              style={{
                width: '100%', maxWidth: 720, height: 'auto', objectFit: 'contain',
                display: generating ? 'block' : 'none',
              }}
            />

            {/* Placeholder */}
            {!videoUrl && !generating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24 }}>
                {(photoUrl || selectedStyle !== 'photo') ? (
                  <>
                    {photoUrl && selectedStyle === 'photo' && (
                      <img src={photoUrl} alt="Selected avatar" style={{
                        width: 100, height: 100, borderRadius: '50%', objectFit: 'cover',
                        border: `3px solid ${GRADIENT[0]}`,
                        boxShadow: `0 4px 20px ${GRADIENT[0]}33`,
                      }} />
                    )}
                    {selectedStyle !== 'photo' && (
                      <div style={{
                        width: 80, height: 80, borderRadius: '50%',
                        background: `linear-gradient(135deg, ${AVATAR_STYLES.find((s) => s.id === selectedStyle)?.color ?? '#888'}, ${AVATAR_STYLES.find((s) => s.id === selectedStyle)?.color ?? '#888'}aa)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `3px solid ${GRADIENT[0]}`,
                        boxShadow: `0 4px 20px ${GRADIENT[0]}33`,
                        color: '#fff', fontSize: 28, fontWeight: 700,
                      }}>
                        {(AVATAR_STYLES.find((s) => s.id === selectedStyle)?.name ?? 'A').charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: 14, color: '#ffffffcc', fontWeight: 600 }}>
                      {AVATAR_STYLES.find((s) => s.id === selectedStyle)?.name ?? 'Avatar'} selected
                    </span>
                    <span style={{ fontSize: 12, color: '#ffffff88', textAlign: 'center', wordBreak: 'break-word', maxWidth: '100%' }}>
                      {step < 5
                        ? `Scene: ${BACKGROUNDS.find((b) => b.id === selectedBg)?.name ?? 'Studio'} | Complete all steps to generate`
                        : 'Click "Create AI Video" to begin'}
                    </span>
                  </>
                ) : (
                  <>
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%',
                      background: '#ffffff0a', border: '2px dashed #ffffff22',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff44" strokeWidth="1.5">
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <span style={{ fontSize: 14, color: '#ffffff66' }}>
                      Upload a photo for Photo Realistic style
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Success indicator */}
          {videoUrl && !generating && (
            <div style={{
              marginTop: 12, padding: '12px 14px', borderRadius: 10,
              background: '#10b98115', border: '1px solid #10b98133',
              display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981', wordBreak: 'break-word', minWidth: 0 }}>
                Video generated successfully! Use the controls above to play or download.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CSS keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </ToolPageShell>
  );
}
