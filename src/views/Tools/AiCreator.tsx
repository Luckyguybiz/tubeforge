'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

const GRADIENT: [string, string] = ['#f59e0b', '#f97316'];

/* ------------------------------------------------------------------ */
/*  Avatar preset definitions                                         */
/* ------------------------------------------------------------------ */
interface AvatarPreset {
  id: string;
  name: string;
  color: string;
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, mouthOpen: number, blinking: boolean) => void;
}

function drawProfessionalMan(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  mouthOpen: number, blinking: boolean,
) {
  const cx = w / 2, cy = h / 2;
  // Head
  ctx.fillStyle = '#e8d5b7';
  ctx.beginPath(); ctx.arc(cx, cy - 10, 70, 0, Math.PI * 2); ctx.fill();
  // Hair
  ctx.fillStyle = '#3b2f2f';
  ctx.beginPath(); ctx.ellipse(cx, cy - 55, 65, 35, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - 65, cy - 55, 10, 30);
  ctx.fillRect(cx + 55, cy - 55, 10, 30);
  // Eyes
  if (blinking) {
    ctx.strokeStyle = '#3b2f2f'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 30, cy - 15); ctx.lineTo(cx - 14, cy - 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 14, cy - 15); ctx.lineTo(cx + 30, cy - 15); ctx.stroke();
  } else {
    ctx.fillStyle = '#2d3748';
    ctx.beginPath(); ctx.arc(cx - 22, cy - 15, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 22, cy - 15, 6, 0, Math.PI * 2); ctx.fill();
    // Eye whites
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx - 20, cy - 17, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 24, cy - 17, 2, 0, Math.PI * 2); ctx.fill();
  }
  // Eyebrows
  ctx.strokeStyle = '#3b2f2f'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx - 32, cy - 28); ctx.lineTo(cx - 12, cy - 30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 12, cy - 30); ctx.lineTo(cx + 32, cy - 28); ctx.stroke();
  // Nose
  ctx.strokeStyle = '#c4a882'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx - 5, cy + 5); ctx.lineTo(cx + 5, cy + 5); ctx.stroke();
  // Mouth
  if (mouthOpen > 0.05) {
    const mh = 4 + mouthOpen * 14;
    ctx.fillStyle = '#8B4513';
    ctx.beginPath(); ctx.ellipse(cx, cy + 22, 12 + mouthOpen * 4, mh, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(cx, cy + 18, 8, 2, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = '#a0522d'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy + 20, 10, 0.2, Math.PI - 0.2); ctx.stroke();
  }
  // Suit
  ctx.fillStyle = '#2d3748';
  ctx.beginPath(); ctx.moveTo(cx - 50, cy + 58); ctx.lineTo(cx - 8, cy + 60);
  ctx.lineTo(cx, cy + 55); ctx.lineTo(cx + 8, cy + 60);
  ctx.lineTo(cx + 50, cy + 58); ctx.lineTo(cx + 70, h);
  ctx.lineTo(cx - 70, h); ctx.closePath(); ctx.fill();
  // Tie
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.moveTo(cx - 6, cy + 55); ctx.lineTo(cx + 6, cy + 55);
  ctx.lineTo(cx + 4, cy + 80); ctx.lineTo(cx, cy + 85); ctx.lineTo(cx - 4, cy + 80);
  ctx.closePath(); ctx.fill();
}

function drawProfessionalWoman(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  mouthOpen: number, blinking: boolean,
) {
  const cx = w / 2, cy = h / 2;
  ctx.fillStyle = '#f0d5b8';
  ctx.beginPath(); ctx.arc(cx, cy - 10, 68, 0, Math.PI * 2); ctx.fill();
  // Hair
  ctx.fillStyle = '#4a2c2a';
  ctx.beginPath(); ctx.ellipse(cx, cy - 50, 72, 42, 0, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillRect(cx - 72, cy - 50, 14, 55);
  ctx.fillRect(cx + 58, cy - 50, 14, 55);
  // Eyes
  if (blinking) {
    ctx.strokeStyle = '#4a2c2a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 28, cy - 15); ctx.lineTo(cx - 12, cy - 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 12, cy - 15); ctx.lineTo(cx + 28, cy - 15); ctx.stroke();
  } else {
    ctx.fillStyle = '#2d3748';
    ctx.beginPath(); ctx.arc(cx - 20, cy - 15, 5.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 20, cy - 15, 5.5, 0, Math.PI * 2); ctx.fill();
    // Eyelashes
    ctx.strokeStyle = '#4a2c2a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx - 20, cy - 15, 8, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 20, cy - 15, 8, Math.PI + 0.3, Math.PI * 2 - 0.3); ctx.stroke();
  }
  // Nose
  ctx.strokeStyle = '#d4b896'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(cx, cy - 5); ctx.lineTo(cx - 4, cy + 5); ctx.lineTo(cx + 4, cy + 5); ctx.stroke();
  // Mouth
  if (mouthOpen > 0.05) {
    const mh = 3 + mouthOpen * 12;
    ctx.fillStyle = '#e84393';
    ctx.beginPath(); ctx.ellipse(cx, cy + 20, 10 + mouthOpen * 3, mh, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#e84393';
    ctx.beginPath(); ctx.arc(cx, cy + 18, 12, 0.1, Math.PI - 0.1); ctx.fill();
  }
  // Blouse
  ctx.fillStyle = '#6c5ce7';
  ctx.beginPath(); ctx.moveTo(cx - 45, cy + 58); ctx.lineTo(cx - 65, h);
  ctx.lineTo(cx + 65, h); ctx.lineTo(cx + 45, cy + 58); ctx.closePath(); ctx.fill();
  // Necklace
  ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(cx, cy + 50, 18, 0.3, Math.PI - 0.3); ctx.stroke();
}

function drawCartoon(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  mouthOpen: number, blinking: boolean,
) {
  const cx = w / 2, cy = h / 2;
  // Big round head
  ctx.fillStyle = '#ffeaa7';
  ctx.beginPath(); ctx.arc(cx, cy - 5, 75, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fdcb6e'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy - 5, 75, 0, Math.PI * 2); ctx.stroke();
  // Eyes
  if (blinking) {
    ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 42, cy - 18); ctx.lineTo(cx - 8, cy - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 8, cy - 18); ctx.lineTo(cx + 42, cy - 18); ctx.stroke();
  } else {
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(cx - 25, cy - 18, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 25, cy - 18, 20, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#2d3436'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(cx - 25, cy - 18, 20, 24, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx + 25, cy - 18, 20, 24, 0, 0, Math.PI * 2); ctx.stroke();
    // Pupils
    ctx.fillStyle = '#2d3436';
    ctx.beginPath(); ctx.arc(cx - 22, cy - 15, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 28, cy - 15, 9, 0, Math.PI * 2); ctx.fill();
    // Eye shine
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx - 19, cy - 19, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 31, cy - 19, 3.5, 0, Math.PI * 2); ctx.fill();
  }
  // Mouth
  if (mouthOpen > 0.05) {
    ctx.fillStyle = '#e17055';
    const mh = 6 + mouthOpen * 18;
    ctx.beginPath(); ctx.ellipse(cx, cy + 20, 18 + mouthOpen * 6, mh, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.ellipse(cx, cy + 24, 10, mh * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.strokeStyle = '#e17055'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy + 15, 25, 0.15, Math.PI - 0.15); ctx.stroke();
  }
  // Cheeks
  ctx.fillStyle = 'rgba(255,150,150,0.35)';
  ctx.beginPath(); ctx.ellipse(cx - 50, cy + 5, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx + 50, cy + 5, 14, 10, 0, 0, Math.PI * 2); ctx.fill();
  // Body
  ctx.fillStyle = '#00b894';
  ctx.beginPath(); ctx.moveTo(cx - 40, cy + 65); ctx.lineTo(cx - 55, h);
  ctx.lineTo(cx + 55, h); ctx.lineTo(cx + 40, cy + 65); ctx.closePath(); ctx.fill();
}

function drawRobot(
  ctx: CanvasRenderingContext2D, w: number, h: number,
  mouthOpen: number, blinking: boolean,
) {
  const cx = w / 2, cy = h / 2;
  // Antenna
  ctx.strokeStyle = '#636e72'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy - 75); ctx.lineTo(cx, cy - 90); ctx.stroke();
  ctx.fillStyle = '#e74c3c';
  ctx.beginPath(); ctx.arc(cx, cy - 93, 6, 0, Math.PI * 2); ctx.fill();
  // Head
  ctx.fillStyle = '#b2bec3';
  ctx.beginPath();
  drawRoundedRect(ctx, cx - 60, cy - 75, 120, 100, 16);
  ctx.fill();
  ctx.strokeStyle = '#636e72'; ctx.lineWidth = 2;
  ctx.beginPath();
  drawRoundedRect(ctx, cx - 60, cy - 75, 120, 100, 16);
  ctx.stroke();
  // Eyes (screens)
  if (blinking) {
    ctx.fillStyle = '#636e72';
    ctx.beginPath(); drawRoundedRect(ctx, cx - 40, cy - 42, 30, 4, 2); ctx.fill();
    ctx.beginPath(); drawRoundedRect(ctx, cx + 10, cy - 42, 30, 4, 2); ctx.fill();
  } else {
    ctx.fillStyle = '#00cec9';
    ctx.beginPath(); drawRoundedRect(ctx, cx - 40, cy - 50, 30, 22, 4); ctx.fill();
    ctx.beginPath(); drawRoundedRect(ctx, cx + 10, cy - 50, 30, 22, 4); ctx.fill();
    // Pupils
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx - 25, cy - 39, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 25, cy - 39, 4, 0, Math.PI * 2); ctx.fill();
  }
  // Mouth panel
  if (mouthOpen > 0.05) {
    ctx.fillStyle = '#636e72';
    ctx.beginPath(); drawRoundedRect(ctx, cx - 30, cy - 12, 60, 14 + mouthOpen * 8, 3); ctx.fill();
    // Animated bars
    ctx.strokeStyle = '#00cec9'; ctx.lineWidth = 2;
    const barCount = 6;
    for (let i = 0; i < barCount; i++) {
      const lx = cx - 24 + i * 10;
      const barH = (4 + Math.sin(i * 2.1 + mouthOpen * 10) * 3) * mouthOpen;
      ctx.beginPath(); ctx.moveTo(lx, cy - 6 + 7 - barH); ctx.lineTo(lx, cy - 6 + 7 + barH); ctx.stroke();
    }
  } else {
    ctx.fillStyle = '#636e72';
    ctx.beginPath(); drawRoundedRect(ctx, cx - 25, cy - 10, 50, 12, 3); ctx.fill();
    ctx.strokeStyle = '#00cec9'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 5; i++) {
      const lx = cx - 20 + i * 10;
      ctx.beginPath(); ctx.moveTo(lx, cy - 8); ctx.lineTo(lx, cy); ctx.stroke();
    }
  }
  // Body
  ctx.fillStyle = '#74b9ff';
  ctx.beginPath(); drawRoundedRect(ctx, cx - 50, cy + 30, 100, 70, 12); ctx.fill();
  ctx.strokeStyle = '#0984e3'; ctx.lineWidth = 2;
  ctx.beginPath(); drawRoundedRect(ctx, cx - 50, cy + 30, 100, 70, 12); ctx.stroke();
  // Chest circle
  ctx.fillStyle = '#ffeaa7';
  ctx.beginPath(); ctx.arc(cx, cy + 60, 12, 0, Math.PI * 2); ctx.fill();
}

/** Helper for rounded rectangles */
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

const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'pro-man', name: 'Professional Man', color: '#3b82f6', draw: drawProfessionalMan },
  { id: 'pro-woman', name: 'Professional Woman', color: '#8b5cf6', draw: drawProfessionalWoman },
  { id: 'cartoon', name: 'Cartoon Character', color: '#10b981', draw: drawCartoon },
  { id: 'robot', name: 'Robot', color: '#06b6d4', draw: drawRobot },
];

const MAX_SCRIPT_CHARS = 1500;

/* ------------------------------------------------------------------ */
/*  Template-based script generation                                   */
/* ------------------------------------------------------------------ */
interface ScriptTemplate {
  topic: string;
  style: string;
  body: string;
}

const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    topic: 'technology',
    style: 'informative',
    body: `The future of technology is being shaped right now, and it is advancing faster than ever before. Artificial intelligence is transforming how we work, communicate, and solve problems. From self-driving cars to personalized medicine, the next decade will bring changes that seemed impossible just a few years ago. Understanding these trends is essential for anyone who wants to stay ahead in the modern world.`,
  },
  {
    topic: 'technology',
    style: 'casual',
    body: `Alright, so let me tell you about something wild that is happening in tech right now. AI is literally everywhere. Your phone, your car, even your fridge is getting smarter. And the craziest part? We are still in the early stages. Imagine what things will look like in five years. Pretty exciting stuff if you ask me.`,
  },
  {
    topic: 'motivation',
    style: 'inspirational',
    body: `Every great achievement starts with the decision to try. You do not need to see the whole staircase, just take the first step. Remember that failure is not the opposite of success, it is part of the journey. The people who achieve extraordinary things are the ones who refuse to give up when things get tough. Believe in yourself and keep pushing forward.`,
  },
  {
    topic: 'motivation',
    style: 'casual',
    body: `Hey, quick reminder for you today. You are doing way better than you think. Seriously. Every small step counts, and progress is not always visible right away. So keep going, stay consistent, and do not compare your chapter one to someone elses chapter twenty. You got this.`,
  },
  {
    topic: 'education',
    style: 'informative',
    body: `Learning is a lifelong process that extends far beyond the classroom. Studies show that the most effective learners use active recall and spaced repetition to retain information. Whether you are picking up a new language, mastering a skill, or exploring a new field, the key is consistency. Just twenty minutes of focused practice each day can lead to remarkable results over time.`,
  },
  {
    topic: 'education',
    style: 'casual',
    body: `So here is a study tip that changed everything for me. Instead of reading your notes over and over, try to explain the concept out loud like you are teaching someone else. If you can explain it simply, you truly understand it. This technique is called the Feynman method, and trust me, it works like magic.`,
  },
  {
    topic: 'health',
    style: 'informative',
    body: `Your daily habits have a profound impact on your long-term health. Research shows that just thirty minutes of moderate exercise, five days a week, can reduce the risk of chronic disease by up to forty percent. Combined with proper nutrition and adequate sleep, these habits form the foundation of a healthier and longer life. Small changes today lead to big results tomorrow.`,
  },
  {
    topic: 'health',
    style: 'casual',
    body: `Okay real talk, you do not need a fancy gym membership or a complicated diet plan to be healthy. Start with the basics. Drink more water, go for a walk, and get some decent sleep. That alone will make a huge difference. And hey, the occasional pizza is totally fine. Balance is everything.`,
  },
  {
    topic: 'business',
    style: 'informative',
    body: `Building a successful business requires more than just a great idea. It demands execution, persistence, and the ability to adapt. The most successful entrepreneurs share a common trait: they listen to their customers. By understanding what people truly need and delivering value consistently, you create a business that stands the test of time.`,
  },
  {
    topic: 'business',
    style: 'casual',
    body: `Want to know the number one mistake people make when starting a business? They build something nobody asked for. Before you spend months on your idea, talk to real people. Find out what they actually need. The best businesses solve real problems. Start there and the rest will follow.`,
  },
  {
    topic: 'storytelling',
    style: 'dramatic',
    body: `It was a cold winter evening when everything changed. The phone rang at exactly midnight, and on the other end was a voice I had not heard in ten years. What they told me next would alter the course of my entire life. Sometimes the biggest turning points come from the most unexpected moments. And this was one of those moments.`,
  },
  {
    topic: 'science',
    style: 'informative',
    body: `The universe is far more mysterious than we ever imagined. Recent discoveries suggest that ordinary matter makes up only about five percent of everything that exists. The rest is dark matter and dark energy, forces we can detect but cannot yet fully explain. Every new finding opens up more questions, and that is what makes science so fascinating.`,
  },
];

const TOPIC_OPTIONS = ['technology', 'motivation', 'education', 'health', 'business', 'storytelling', 'science'];
const STYLE_OPTIONS = ['informative', 'casual', 'inspirational', 'dramatic'];

function generateScript(topic: string, style: string): string {
  // Find exact match first
  const exact = SCRIPT_TEMPLATES.find((t) => t.topic === topic && t.style === style);
  if (exact) return exact.body;
  // Fall back to same topic
  const topicMatch = SCRIPT_TEMPLATES.find((t) => t.topic === topic);
  if (topicMatch) return topicMatch.body;
  // Fall back to same style
  const styleMatch = SCRIPT_TEMPLATES.find((t) => t.style === style);
  if (styleMatch) return styleMatch.body;
  // Random
  return SCRIPT_TEMPLATES[Math.floor(Math.random() * SCRIPT_TEMPLATES.length)].body;
}

/* ------------------------------------------------------------------ */
/*  Blink scheduler                                                    */
/* ------------------------------------------------------------------ */
function shouldBlink(time: number): boolean {
  const cycle = time % 4;
  return cycle > 3.85;
}

/* ------------------------------------------------------------------ */
/*  Floating particle type                                             */
/* ------------------------------------------------------------------ */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
}

function createParticles(count: number, width: number, height: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.4 - 0.2,
      radius: 2 + Math.random() * 4,
      alpha: 0.04 + Math.random() * 0.08,
    });
  }
  return particles;
}

function updateParticles(particles: Particle[], width: number, height: number, dt: number) {
  for (const p of particles) {
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;
  }
}

/* ------------------------------------------------------------------ */
/*  Word splitter for subtitles                                        */
/* ------------------------------------------------------------------ */
function splitIntoSubtitleChunks(text: string, wordsPerChunk: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerChunk) {
    chunks.push(words.slice(i, i + wordsPerChunk).join(' '));
  }
  return chunks;
}

/* ------------------------------------------------------------------ */
/*  Draw a full video frame                                            */
/* ------------------------------------------------------------------ */
function drawVideoFrame(
  ctx: CanvasRenderingContext2D,
  WIDTH: number,
  HEIGHT: number,
  time: number,
  mouthOpen: number,
  blinking: boolean,
  avatarImg: HTMLImageElement | null,
  preset: AvatarPreset | null,
  particles: Particle[],
  subtitleText: string,
  dt: number,
) {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // ── Animated gradient background ──
  const shift = (time * 0.15) % 1;
  const grad = ctx.createLinearGradient(
    WIDTH * 0.5 + Math.sin(shift * Math.PI * 2) * WIDTH * 0.3,
    0,
    WIDTH * 0.5 - Math.sin(shift * Math.PI * 2 + 1) * WIDTH * 0.3,
    HEIGHT,
  );
  grad.addColorStop(0, '#1a1a2e');
  grad.addColorStop(0.3, '#16213e');
  grad.addColorStop(0.6, '#0f3460');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Subtle animated accent glow
  const glowGrad = ctx.createRadialGradient(
    WIDTH / 2 + Math.sin(time * 0.4) * 100, HEIGHT * 0.35,
    50,
    WIDTH / 2, HEIGHT * 0.35,
    400,
  );
  glowGrad.addColorStop(0, `${GRADIENT[0]}18`);
  glowGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── Floating particles ──
  updateParticles(particles, WIDTH, HEIGHT, dt);
  for (const p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
    ctx.fill();
  }

  // ── Avatar circle ──
  const avatarCx = WIDTH / 2;
  const avatarCy = HEIGHT * 0.35;
  const avatarR = 130;

  // Glow ring behind avatar
  const ringGrad = ctx.createRadialGradient(avatarCx, avatarCy, avatarR - 5, avatarCx, avatarCy, avatarR + 20);
  ringGrad.addColorStop(0, `${GRADIENT[0]}33`);
  ringGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = ringGrad;
  ctx.beginPath();
  ctx.arc(avatarCx, avatarCy, avatarR + 20, 0, Math.PI * 2);
  ctx.fill();

  // Breathing / idle movement
  const breathScale = 1 + Math.sin(time * 0.8) * 0.008;
  const headX = Math.sin(time * 0.3) * 3;
  const headY = Math.cos(time * 0.5) * 2;

  ctx.save();
  ctx.translate(avatarCx + headX, avatarCy + headY);
  ctx.scale(breathScale, breathScale);

  // Clip to circle
  ctx.beginPath();
  ctx.arc(0, 0, avatarR, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  // Fill circle background
  ctx.fillStyle = '#1a1a2e';
  ctx.beginPath();
  ctx.arc(0, 0, avatarR, 0, Math.PI * 2);
  ctx.fill();

  if (avatarImg) {
    // Draw user's uploaded photo
    const imgW = avatarImg.width;
    const imgH = avatarImg.height;
    const scale = Math.max((avatarR * 2) / imgW, (avatarR * 2) / imgH);
    const dw = imgW * scale;
    const dh = imgH * scale;
    ctx.drawImage(avatarImg, -dw / 2, -dh / 2, dw, dh);

    // Blink overlay
    if (blinking) {
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-avatarR, -avatarR * 0.15, avatarR * 2, avatarR * 0.12);
    }

    // Mouth movement overlay for photos
    if (mouthOpen > 0.05) {
      const mouthY = avatarR * 0.35;
      const mh = 4 + mouthOpen * 12;
      ctx.fillStyle = `rgba(30, 20, 20, ${0.12 + mouthOpen * 0.25})`;
      ctx.beginPath();
      ctx.ellipse(0, mouthY, 16 + mouthOpen * 8, mh, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (preset) {
    // Draw procedural face from preset
    preset.draw(ctx, avatarR * 2, avatarR * 2, mouthOpen, blinking);
  }

  ctx.restore();

  // Avatar circle border
  ctx.strokeStyle = `${GRADIENT[0]}88`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(avatarCx + headX, avatarCy + headY, avatarR * breathScale + 2, 0, Math.PI * 2);
  ctx.stroke();

  // ── Name plate ──
  const nameText = avatarImg ? 'AI Presenter' : (preset?.name ?? 'Avatar');
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText(nameText, avatarCx, avatarCy + avatarR + 40);
  ctx.textAlign = 'start';

  // ── Audio level bars ──
  if (mouthOpen > 0.02) {
    const barsX = avatarCx;
    const barsY = avatarCy + avatarR + 60;
    const barCount = 5;
    const barSpacing = 8;
    const startX = barsX - ((barCount - 1) * barSpacing) / 2;
    for (let i = 0; i < barCount; i++) {
      const h = 4 + Math.sin(time * 12 + i * 1.5) * mouthOpen * 12;
      const alphaHex = Math.round(150 + mouthOpen * 100).toString(16).padStart(2, '0');
      ctx.fillStyle = `${GRADIENT[0]}${alphaHex}`;
      fillRoundedRect(ctx, startX + i * barSpacing - 2, barsY - h / 2, 4, Math.max(h, 2), 2);
    }
  }

  // ── Subtitle text at bottom ──
  if (subtitleText) {
    const subY = HEIGHT * 0.78;
    const maxWidth = WIDTH * 0.85;
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';

    // Background panel
    const textMetrics = ctx.measureText(subtitleText);
    const textW = Math.min(textMetrics.width, maxWidth);
    const padding = 16;
    const bgX = (WIDTH - textW) / 2 - padding;
    const bgY = subY - 28;
    const bgW = textW + padding * 2;
    const bgH = 44;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    fillRoundedRect(ctx, bgX, bgY, bgW, bgH, 12);

    // Text
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subtitleText, WIDTH / 2, subY, maxWidth);
    ctx.textAlign = 'start';
  }

  // ── TubeForge watermark ──
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText('Made with TubeForge', WIDTH / 2, HEIGHT - 40);
  ctx.textAlign = 'start';
}


/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function AiCreator() {
  const C = useThemeStore((s) => s.theme);

  /* Wizard step: 1=avatar, 2=script, 3=voice, 4=generate/preview */
  const [step, setStep] = useState(1);

  /* Step 1 - avatar */
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);

  /* Step 2 - script */
  const [script, setScript] = useState('');
  const [genTopic, setGenTopic] = useState('technology');
  const [genStyle, setGenStyle] = useState('informative');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  /* Step 3 - voice */
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceUri, setSelectedVoiceUri] = useState<string>('');
  const [hoveredVoice, setHoveredVoice] = useState<string | null>(null);

  /* Step 4 - generation & preview */
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

  /* Preset thumbnail canvases for selection UI */
  const presetThumbnailRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

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
  /*  Draw preset thumbnails                                          */
  /* ---------------------------------------------------------------- */
  const drawThumbnail = useCallback((canvas: HTMLCanvasElement | null, preset: AvatarPreset) => {
    if (!canvas) return;
    presetThumbnailRefs.current.set(preset.id, canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = 100;
    canvas.height = 100;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 100, 100);
    ctx.save();
    ctx.scale(0.5, 0.5);
    ctx.translate(0, -10);
    preset.draw(ctx, 200, 220, 0, false);
    ctx.restore();
  }, []);

  /* ---------------------------------------------------------------- */
  /*  AI Script Generation (template-based)                           */
  /* ---------------------------------------------------------------- */
  const handleAiScript = useCallback(() => {
    setIsGeneratingScript(true);
    // Short delay to simulate generation
    setTimeout(() => {
      const generated = generateScript(genTopic, genStyle);
      setScript(generated);
      setIsGeneratingScript(false);
    }, 600);
  }, [genTopic, genStyle]);

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
  /*  Main generation pipeline: Canvas + SpeechSynthesis + MediaRecorder */
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
      /* --- Set up avatar source --- */
      setStatusText('Loading avatar...');
      setProgress(5);

      const avatarImg = await getAvatarImage();
      const preset = selectedPreset
        ? AVATAR_PRESETS.find((p) => p.id === selectedPreset) ?? null
        : null;

      if (!avatarImg && !preset) {
        throw new Error('No avatar selected. Go back to step 1.');
      }

      if (abortRef.current) return;

      /* --- Prepare speech and word tracking --- */
      setStatusText('Preparing speech...');
      setProgress(10);

      const allWords = script.trim().split(/\s+/).filter(Boolean);
      const subtitleChunks = splitIntoSubtitleChunks(script, 6);

      /* --- Set up canvas --- */
      const WIDTH = 720;
      const HEIGHT = 720;
      const canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d')!;

      // Show canvas in preview area
      if (canvasRef.current) {
        canvasRef.current.width = WIDTH;
        canvasRef.current.height = HEIGHT;
      }

      const particles = createParticles(20, WIDTH, HEIGHT);

      /* --- Set up MediaRecorder --- */
      setStatusText('Starting recording...');
      setProgress(15);

      const stream = canvas.captureStream(30);

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
          ? 'video/webm;codecs=vp8'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 });
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

      /* --- Start SpeechSynthesis --- */
      setStatusText('Generating video with narration...');
      setProgress(20);

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(script);
      const voice = voices.find((v) => v.voiceURI === selectedVoiceUri);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.pitch = 1;

      let currentWordIndex = 0;
      let ttsFinished = false;
      const wordTimestamps: number[] = [];
      const startTime = performance.now();

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

      /* --- Animation loop --- */
      let lastFrameTime = performance.now();

      const animationDone = new Promise<void>((resolve) => {
        function draw() {
          if (abortRef.current) { resolve(); return; }

          const now = performance.now();
          const dt = (now - lastFrameTime) / 1000;
          lastFrameTime = now;
          const elapsed = (now - startTime) / 1000;

          // If TTS boundary events do not fire, estimate word index
          if (wordTimestamps.length === 0 && elapsed > 0.5) {
            currentWordIndex = Math.min(Math.floor(elapsed * 3), allWords.length);
          }

          // Compute mouth open level
          const recentWords = wordTimestamps.filter((t) => now - t < 200).length;
          let mouthLevel = ttsFinished ? 0 : Math.min(recentWords * 0.35 + 0.15, 1);
          if (!ttsFinished && wordTimestamps.length === 0 && elapsed > 0.5) {
            // Simulated mouth movement
            mouthLevel = 0.3 + Math.sin(elapsed * 8) * 0.25 + Math.sin(elapsed * 5.3) * 0.15;
            mouthLevel = Math.max(0, Math.min(1, mouthLevel));
          }
          mouthLevel *= 0.7 + Math.sin(now / 1000 * 12) * 0.3;

          const blinking = shouldBlink(elapsed);

          // Current subtitle chunk
          const chunkIndex = Math.min(
            Math.floor(currentWordIndex / 6),
            subtitleChunks.length - 1,
          );
          const subtitle = subtitleChunks[Math.max(0, chunkIndex)] ?? '';

          drawVideoFrame(
            ctx, WIDTH, HEIGHT, elapsed,
            ttsFinished ? 0 : mouthLevel,
            blinking,
            avatarImg, preset, particles, subtitle, dt,
          );

          // Mirror to visible canvas
          if (canvasRef.current) {
            const visCtx = canvasRef.current.getContext('2d');
            if (visCtx) {
              visCtx.clearRect(0, 0, WIDTH, HEIGHT);
              visCtx.drawImage(canvas, 0, 0);
            }
          }

          // Update progress
          if (!ttsFinished) {
            const p = 20 + (currentWordIndex / Math.max(allWords.length, 1)) * 65;
            setProgress(Math.min(p, 88));
          }

          if (!ttsFinished && elapsed < 300 && !abortRef.current) {
            animFrameRef.current = requestAnimationFrame(draw);
          } else {
            resolve();
          }
        }
        animFrameRef.current = requestAnimationFrame(draw);
      });

      await Promise.all([ttsPromise, animationDone]);

      if (abortRef.current) { recorder.stop(); return; }

      // Draw a few more "ending" frames
      setStatusText('Finalizing...');
      setProgress(90);

      const endStart = performance.now();
      await new Promise<void>((resolve) => {
        function endFrames() {
          const now = performance.now();
          const elapsed = (now - startTime) / 1000;
          const frameDt = 1 / 30;
          const fe = (now - endStart) / 1000;

          drawVideoFrame(
            ctx, WIDTH, HEIGHT, elapsed,
            0, false, avatarImg, preset, particles, '', frameDt,
          );

          // Fade in "Thanks for watching"
          const alpha = Math.min(1, fe / 0.5);
          ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
          ctx.fillText('Thanks for watching!', WIDTH / 2, HEIGHT * 0.78);
          ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
          ctx.fillText('Made with TubeForge', WIDTH / 2, HEIGHT * 0.78 + 40);
          ctx.textAlign = 'start';

          // Mirror
          if (canvasRef.current) {
            const visCtx = canvasRef.current.getContext('2d');
            if (visCtx) {
              visCtx.clearRect(0, 0, WIDTH, HEIGHT);
              visCtx.drawImage(canvas, 0, 0);
            }
          }

          if (fe < 1.5) {
            requestAnimationFrame(endFrames);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(endFrames);
      });

      /* --- Stop recording and finalize --- */
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
    photoUrl, selectedPreset, videoUrl, getAvatarImage,
  ]);

  /* ---------------------------------------------------------------- */
  /*  Download handler                                                */
  /* ---------------------------------------------------------------- */
  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'ai-avatar-video.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [videoUrl]);

  /* ---------------------------------------------------------------- */
  /*  Cancel handler                                                  */
  /* ---------------------------------------------------------------- */
  const handleCancel = useCallback(() => {
    abortRef.current = true;
    window.speechSynthesis?.cancel();
    cancelAnimationFrame(animFrameRef.current);
    setGenerating(false);
    setStatusText('Cancelled.');
  }, []);

  /* ---------------------------------------------------------------- */
  /*  Step navigation logic                                           */
  /* ---------------------------------------------------------------- */
  const canAdvance = useMemo(() => {
    if (step === 1) return photo !== null || selectedPreset !== null;
    if (step === 2) return script.trim().length > 0;
    if (step === 3) return !!selectedVoiceUri;
    return false;
  }, [step, photo, selectedPreset, script, selectedVoiceUri]);

  const handleStartOver = useCallback(() => {
    window.speechSynthesis?.cancel();
    cancelAnimationFrame(animFrameRef.current);
    abortRef.current = true;
    setStep(1);
    setPhoto(null);
    setPhotoUrl(null);
    setSelectedPreset(null);
    setScript('');
    setGenerating(false);
    setProgress(0);
    setStatusText('');
    setError('');
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
  }, [videoUrl]);

  /* Clean up on unmount */
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  /* Voice display list (limit to 12 for UI) */
  const displayVoices = useMemo(() => {
    const english = voices.filter((v) => v.lang.startsWith('en'));
    const list = english.length > 0 ? english : voices;
    return list.slice(0, 12);
  }, [voices]);

  const stepLabels = ['Choose Avatar', 'Write Script', 'Select Voice', 'Create Video'];

  /* ================================================================ */
  /*  RENDER                                                          */
  /* ================================================================ */
  return (
    <ToolPageShell
      title="AI Avatar Video Creator"
      subtitle="Create animated avatar videos with text-to-speech -- upload a photo or choose a preset"
      gradient={GRADIENT}
    >
      {/* ---- Progress Steps ---- */}
      <div style={{
        padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card,
        marginBottom: 24, overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 500 }}>
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
                    fontSize: 12, fontWeight: isActive ? 700 : 500,
                    color: isActive ? C.text : C.dim, whiteSpace: 'nowrap',
                  }}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div style={{
                    flex: 1, height: 2, margin: '0 10px',
                    background: isComplete ? GRADIENT[0] : C.border,
                    borderRadius: 1, transition: 'background 0.3s ease',
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* ================================================================ */}
        {/*  LEFT: Step content                                              */}
        {/* ================================================================ */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ---- STEP 1: Avatar Selection ---- */}
          {step === 1 && (
            <>
              <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 14 }}>
                  Upload Your Photo
                </span>
                {!photo ? (
                  <UploadArea C={C} accept="image/*" onFile={(f) => { setPhoto(f); setSelectedPreset(null); }} label="Drop a photo or click to upload" />
                ) : (
                  <div style={{
                    padding: 14, borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface,
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    {photoUrl && (
                      <img src={photoUrl} alt="Avatar" style={{
                        width: 48, height: 48, borderRadius: 12, objectFit: 'cover',
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
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s ease',
                        outline: 'none', flexShrink: 0,
                      }}
                    >Remove</button>
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'center', color: C.dim, fontSize: 13, fontWeight: 600 }}>--- OR ---</div>

              <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 14 }}>
                  Select Avatar Preset
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    const isHov = hoveredPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        onClick={() => { setSelectedPreset(preset.id); setPhoto(null); }}
                        onMouseEnter={() => setHoveredPreset(preset.id)}
                        onMouseLeave={() => setHoveredPreset(null)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                          padding: '14px 10px', borderRadius: 12,
                          border: `2px solid ${isSelected ? preset.color : isHov ? `${preset.color}88` : C.border}`,
                          background: isSelected ? `${preset.color}15` : isHov ? `${preset.color}08` : C.surface,
                          cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'inherit',
                          outline: 'none',
                        }}
                      >
                        <canvas
                          ref={(c) => drawThumbnail(c, preset)}
                          width={100}
                          height={100}
                          style={{ width: 80, height: 80, borderRadius: 10 }}
                        />
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: isSelected ? preset.color : C.sub,
                        }}>{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* ---- STEP 2: Script Input ---- */}
          {step === 2 && (
            <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 14 }}>
                Write Your Script
              </span>
              <textarea
                value={script}
                onChange={(e) => {
                  if (e.target.value.length <= MAX_SCRIPT_CHARS) setScript(e.target.value);
                }}
                placeholder="Type what the avatar should say..."
                style={{
                  width: '100%', minHeight: 180, padding: 14, borderRadius: 12,
                  border: `1px solid ${C.border}`, background: C.surface,
                  color: C.text, fontSize: 14, fontFamily: 'inherit',
                  resize: 'vertical', outline: 'none', lineHeight: 1.6,
                  transition: 'border-color 0.2s ease', boxSizing: 'border-box',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <span style={{
                  fontSize: 12,
                  color: script.length > MAX_SCRIPT_CHARS * 0.9 ? '#ef4444' : C.dim,
                }}>
                  {script.length} / {MAX_SCRIPT_CHARS}
                </span>
              </div>

              {/* AI Script Generator */}
              <div style={{
                marginTop: 16, paddingTop: 16,
                borderTop: `1px solid ${C.border}`,
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.sub, display: 'block', marginBottom: 10 }}>
                  AI Generate Script
                </span>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.dim, display: 'block', marginBottom: 4 }}>
                      Topic
                    </label>
                    <select
                      value={genTopic}
                      onChange={(e) => setGenTopic(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8,
                        border: `1px solid ${C.border}`, background: C.surface,
                        color: C.text, fontSize: 13, fontFamily: 'inherit',
                        outline: 'none', cursor: 'pointer',
                      }}
                    >
                      {TOPIC_OPTIONS.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: C.dim, display: 'block', marginBottom: 4 }}>
                      Style
                    </label>
                    <select
                      value={genStyle}
                      onChange={(e) => setGenStyle(e.target.value)}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8,
                        border: `1px solid ${C.border}`, background: C.surface,
                        color: C.text, fontSize: 13, fontFamily: 'inherit',
                        outline: 'none', cursor: 'pointer',
                      }}
                    >
                      {STYLE_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  onClick={handleAiScript}
                  disabled={isGeneratingScript}
                  onMouseEnter={() => setHoveredBtn('ai-gen')}
                  onMouseLeave={() => setHoveredBtn(null)}
                  style={{
                    padding: '10px 20px', borderRadius: 10, border: 'none',
                    background: isGeneratingScript
                      ? '#55555588'
                      : `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                    color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: isGeneratingScript ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s ease', outline: 'none',
                    boxShadow: isGeneratingScript ? 'none' : `0 4px 12px ${GRADIENT[0]}33`,
                    transform: hoveredBtn === 'ai-gen' && !isGeneratingScript ? 'translateY(-1px)' : 'none',
                  }}
                >
                  {isGeneratingScript && (
                    <svg width="14" height="14" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                      <circle cx="8" cy="8" r="6" stroke="rgba(255,255,255,.3)" strokeWidth="2" fill="none" />
                      <path d="M8 2a6 6 0 014.47 2" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </svg>
                  )}
                  {isGeneratingScript ? 'Generating...' : 'Generate Script'}
                </button>
              </div>
            </div>
          )}

          {/* ---- STEP 3: Voice Selection ---- */}
          {step === 3 && (
            <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 6 }}>
                Select TTS Voice
              </span>
              <span style={{ fontSize: 12, color: C.dim, display: 'block', marginBottom: 16 }}>
                Choose a voice for the avatar speech (browser SpeechSynthesis)
              </span>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
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
                          borderRadius: 10,
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

              {/* Test voice button */}
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
                    padding: '8px 18px', borderRadius: 10,
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
            </div>
          )}

          {/* ---- STEP 4: Generate & Preview ---- */}
          {step === 4 && (
            <div style={{ padding: 20, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text, display: 'block', marginBottom: 8 }}>
                Create AI Video
              </span>
              <span style={{ fontSize: 12, color: C.dim, display: 'block', marginBottom: 16 }}>
                This will use SpeechSynthesis to narrate your script while recording an animated avatar video.
                The avatar will have mouth animation synced to speech, blinking eyes, and subtle idle movements.
              </span>

              {/* Summary of selections */}
              <div style={{
                padding: 14, borderRadius: 12, background: C.surface,
                border: `1px solid ${C.border}`, marginBottom: 16,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ fontSize: 12, color: C.dim }}>
                  <span style={{ fontWeight: 600, color: C.sub }}>Avatar:</span>{' '}
                  {photo ? photo.name : selectedPreset ? AVATAR_PRESETS.find((p) => p.id === selectedPreset)?.name : 'None'}
                </div>
                <div style={{ fontSize: 12, color: C.dim }}>
                  <span style={{ fontWeight: 600, color: C.sub }}>Voice:</span>{' '}
                  {voices.find((v) => v.voiceURI === selectedVoiceUri)?.name ?? 'Default'}
                </div>
                <div style={{ fontSize: 12, color: C.dim }}>
                  <span style={{ fontWeight: 600, color: C.sub }}>Script:</span>{' '}
                  {script.trim().split(/\s+/).length} words - &quot;{script.slice(0, 80)}{script.length > 80 ? '...' : ''}&quot;
                </div>
              </div>

              {/* Error display */}
              {error && (
                <div style={{
                  padding: '12px 16px', borderRadius: 10, marginBottom: 14,
                  background: `${C.red}12`,
                  border: `1px solid ${C.red}30`,
                  color: C.red, fontSize: 13, fontWeight: 500,
                }}>
                  {error}
                </div>
              )}

              {/* Generate / Cancel / Download buttons */}
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
                      padding: '12px 20px', borderRadius: 12,
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
                        padding: '12px 24px', borderRadius: 12, border: 'none',
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
                        padding: '12px 18px', borderRadius: 12, border: `1px solid ${C.border}`,
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
            </div>
          )}

          {/* ---- Navigation Buttons ---- */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
            {step > 1 && (
              <button
                onClick={() => {
                  handleCancel();
                  setStep(step - 1);
                }}
                onMouseEnter={() => setHoveredBtn('back')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: '12px 24px', borderRadius: 12,
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
            {step < 4 && (
              <button
                onClick={() => {
                  if (canAdvance) setStep(step + 1);
                }}
                disabled={!canAdvance}
                onMouseEnter={() => setHoveredBtn('next')}
                onMouseLeave={() => setHoveredBtn(null)}
                style={{
                  padding: '12px 24px', borderRadius: 12, border: 'none',
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
                  padding: '12px 18px', borderRadius: 12,
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
          padding: 24, borderRadius: 16, border: `1px solid ${C.border}`, background: C.card,
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>
                  {statusText}
                </span>
                <span style={{ fontSize: 12, color: C.dim, fontWeight: 600 }}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          )}

          {/* Video player (shown after generation) or canvas preview or placeholder */}
          <div style={{
            flex: 1, minHeight: 400, borderRadius: 14,
            border: `1px solid ${C.border}`, background: '#1a1a2e',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Completed video playback */}
            {videoUrl && !generating && (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                playsInline
                style={{
                  width: '100%', height: '100%', objectFit: 'contain',
                  display: 'block',
                }}
              />
            )}

            {/* Canvas for live recording preview */}
            <canvas
              ref={canvasRef}
              width={720}
              height={720}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                display: generating ? 'block' : 'none',
              }}
            />

            {/* Placeholder when nothing is happening */}
            {!videoUrl && !generating && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: 24 }}>
                {(photoUrl || selectedPreset) ? (
                  <>
                    {photoUrl && (
                      <img src={photoUrl} alt="Selected avatar" style={{
                        width: 100, height: 100, borderRadius: '50%', objectFit: 'cover',
                        border: `3px solid ${GRADIENT[0]}`,
                        boxShadow: `0 4px 20px ${GRADIENT[0]}33`,
                      }} />
                    )}
                    {selectedPreset && !photoUrl && (
                      <div style={{
                        width: 100, height: 100, borderRadius: '50%', overflow: 'hidden',
                        border: `3px solid ${GRADIENT[0]}`,
                        boxShadow: `0 4px 20px ${GRADIENT[0]}33`,
                      }}>
                        <canvas
                          ref={(c) => {
                            if (c) {
                              const pr = AVATAR_PRESETS.find((p) => p.id === selectedPreset);
                              if (pr) {
                                c.width = 200;
                                c.height = 200;
                                const cx2 = c.getContext('2d');
                                if (cx2) {
                                  cx2.fillStyle = '#1a1a2e';
                                  cx2.fillRect(0, 0, 200, 200);
                                  pr.draw(cx2, 200, 200, 0, false);
                                }
                              }
                            }
                          }}
                          style={{ width: 100, height: 100 }}
                        />
                      </div>
                    )}
                    <span style={{ fontSize: 14, color: '#ffffffcc', fontWeight: 600 }}>
                      Avatar selected
                    </span>
                    <span style={{ fontSize: 12, color: '#ffffff88' }}>
                      {step < 4 ? 'Complete all steps to generate video' : 'Click "Create AI Video" to begin'}
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
                      Select an avatar to begin
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Success indicator below preview */}
          {videoUrl && !generating && (
            <div style={{
              marginTop: 12, padding: '12px 14px', borderRadius: 10,
              background: '#10b98115', border: '1px solid #10b98133',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
                Video generated successfully! Use the controls above to play or download.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CSS keyframes for animations */}
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
