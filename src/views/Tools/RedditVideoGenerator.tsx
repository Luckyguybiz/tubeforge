'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════════════════════════════════════ */

const GRADIENT: [string, string] = ['#f97316', '#ef4444'];

/* ─── Background Video Styles ─── */

type BgStyleId = 'minecraft' | 'subway' | 'gta' | 'satisfying' | 'solid';

interface BgStyleDef {
  id: BgStyleId;
  label: string;
  emoji: string;
  colors: string[];
}

const BACKGROUND_STYLES: BgStyleDef[] = [
  { id: 'minecraft', label: 'Minecraft Parkour', emoji: '\u26cf', colors: ['#4ade80', '#854d0e', '#166534'] },
  { id: 'subway', label: 'Subway Surfers', emoji: '\ud83d\ude83', colors: ['#f59e0b', '#3b82f6', '#ef4444'] },
  { id: 'gta', label: 'GTA Driving', emoji: '\ud83d\ude97', colors: ['#1e293b', '#475569', '#f97316'] },
  { id: 'satisfying', label: 'Satisfying', emoji: '\ud83c\udf00', colors: ['#a855f7', '#ec4899', '#06b6d4'] },
  { id: 'solid', label: 'Solid Color', emoji: '\ud83c\udfa8', colors: ['#7c3aed', '#2563eb', '#059669'] },
];

/* ─── Voice Presets ─── */

interface VoicePreset {
  id: string;
  label: string;
  rate: number;
  pitch: number;
}

const VOICE_PRESETS: VoicePreset[] = [
  { id: 'normal', label: 'Normal', rate: 1.0, pitch: 1.0 },
  { id: 'fast', label: 'Fast', rate: 1.3, pitch: 1.0 },
  { id: 'deep', label: 'Deep', rate: 0.9, pitch: 0.7 },
  { id: 'high', label: 'High', rate: 1.0, pitch: 1.3 },
];

/* ─── Video Format Presets ─── */

interface VideoFormat {
  id: string;
  label: string;
  width: number;
  height: number;
  aspect: string;
}

const VIDEO_FORMATS: VideoFormat[] = [
  { id: '9:16', label: 'Shorts / TikTok', width: 1080, height: 1920, aspect: '9/16' },
  { id: '16:9', label: 'YouTube', width: 1920, height: 1080, aspect: '16/9' },
  { id: '1:1', label: 'Instagram', width: 1080, height: 1080, aspect: '1/1' },
];

/* ─── Award Definitions ─── */

interface AwardDef {
  name: string;
  color: string;
  icon: string; // single char
}

const AWARDS: AwardDef[] = [
  { name: 'Gold', color: '#FFD700', icon: '\u2605' },
  { name: 'Silver', color: '#C0C0C0', icon: '\u2606' },
  { name: 'Helpful', color: '#ff6b6b', icon: '\u2665' },
];

/* ═══════════════════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════════════════ */

interface RedditPostData {
  title: string;
  body: string;
  subreddit: string;
  author: string;
  upvotes: number;
  commentCount: number;
  comments: RedditComment[];
}

interface RedditComment {
  author: string;
  body: string;
  upvotes: number;
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers — text, shapes, parsing
   ═══════════════════════════════════════════════════════════════════════════ */

function isValidRedditUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?reddit\.com\/r\/\w+\/comments\/\w+/i.test(url.trim());
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  lineHeight: number,
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
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

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const AVATAR_COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#1dd1a1', '#ff6348'];

function avatarColor(name: string): string {
  return AVATAR_COLORS[hashStr(name) % AVATAR_COLORS.length]!;
}

function formatUpvotes(n: number): string {
  if (n >= 100000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/** Fetch a Reddit post from the public JSON API */
async function fetchRedditPost(url: string): Promise<RedditPostData> {
  let cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('.json')) cleanUrl += '.json';

  const resp = await fetch(cleanUrl, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`Reddit API returned ${resp.status}`);

  const json = await resp.json();
  const postData = json?.[0]?.data?.children?.[0]?.data;
  if (!postData) throw new Error('Could not parse Reddit response');

  const commentNodes = json?.[1]?.data?.children ?? [];
  const comments: RedditComment[] = commentNodes
    .filter((c: { kind: string }) => c.kind === 't1')
    .slice(0, 8)
    .map((c: { data: { body: string; author: string; ups: number } }) => ({
      author: c.data.author ?? 'anonymous',
      body: (c.data.body ?? '').slice(0, 400),
      upvotes: c.data.ups ?? 0,
    }));

  return {
    title: postData.title ?? 'Untitled',
    body: (postData.selftext ?? '').slice(0, 1500),
    subreddit: postData.subreddit_name_prefixed ?? 'r/unknown',
    author: postData.author ?? 'anonymous',
    upvotes: postData.ups ?? 0,
    commentCount: postData.num_comments ?? 0,
    comments,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Background Renderers — each draws a full-frame animated background
   ═══════════════════════════════════════════════════════════════════════════ */

function drawBgMinecraft(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#87CEEB');
  sky.addColorStop(0.6, '#5db8f5');
  sky.addColorStop(1, '#3a8fd4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun
  ctx.beginPath();
  ctx.arc(W * 0.8, H * 0.1, 50, 0, Math.PI * 2);
  ctx.fillStyle = '#ffe066';
  ctx.fill();

  // Scrolling 3D-perspective blocks
  const blockSize = Math.max(40, Math.round(W / 18));
  const cols = Math.ceil(W / blockSize) + 2;
  const rows = Math.ceil(H / blockSize) + 4;
  const scrollY = (t * 120) % blockSize;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * blockSize;
      const y = row * blockSize - scrollY;
      const seed = (col * 7 + row * 13) % 17;

      // Determine block type
      if (seed < 5) {
        // Grass block
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(x, y, blockSize - 1, blockSize * 0.3);
        ctx.fillStyle = '#854d0e';
        ctx.fillRect(x, y + blockSize * 0.3, blockSize - 1, blockSize * 0.7 - 1);
      } else if (seed < 8) {
        // Stone
        ctx.fillStyle = '#9ca3af';
        ctx.fillRect(x, y, blockSize - 1, blockSize - 1);
        // Texture lines
        ctx.strokeStyle = '#6b7280';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 3, y + 3, blockSize - 7, blockSize - 7);
      } else if (seed < 10) {
        // Wood
        ctx.fillStyle = '#92400e';
        ctx.fillRect(x, y, blockSize - 1, blockSize - 1);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x + blockSize * 0.3, y, blockSize * 0.4, blockSize - 1);
      } else if (seed < 12) {
        // Diamond ore
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x, y, blockSize - 1, blockSize - 1);
        ctx.fillStyle = '#22d3ee';
        const dSize = blockSize * 0.2;
        ctx.fillRect(x + blockSize * 0.2, y + blockSize * 0.3, dSize, dSize);
        ctx.fillRect(x + blockSize * 0.6, y + blockSize * 0.6, dSize, dSize);
      } else {
        // Dirt
        ctx.fillStyle = '#a16207';
        ctx.fillRect(x, y, blockSize - 1, blockSize - 1);
        // Speckles
        ctx.fillStyle = '#92400e';
        for (let s = 0; s < 3; s++) {
          const sx = x + ((s * 11 + col * 3) % (blockSize - 6)) + 2;
          const sy = y + ((s * 7 + row * 5) % (blockSize - 6)) + 2;
          ctx.fillRect(sx, sy, 3, 3);
        }
      }

      // 3D perspective: light edge on top-left
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x, y, blockSize - 1, 2);
      ctx.fillRect(x, y, 2, blockSize - 1);
      // Dark edge on bottom-right
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x, y + blockSize - 3, blockSize - 1, 2);
      ctx.fillRect(x + blockSize - 3, y, 2, blockSize - 1);
    }
  }

  // Dim overlay for readability
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, W, H);
}

function drawBgSubway(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  // Sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#1e3a5f');
  sky.addColorStop(0.4, '#2563eb');
  sky.addColorStop(1, '#60a5fa');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // 3 lanes
  const laneW = W / 3;
  const laneColors = ['#e2e8f0', '#cbd5e1', '#e2e8f0'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = laneColors[i]!;
    ctx.fillRect(i * laneW + 4, H * 0.4, laneW - 8, H * 0.6);
  }

  // Lane dividers
  ctx.strokeStyle = '#fbbf24';
  ctx.lineWidth = 4;
  ctx.setLineDash([30, 20]);
  ctx.lineDashOffset = -(t * 200) % 50;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * laneW, H * 0.4);
    ctx.lineTo(i * laneW, H);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Scrolling objects in lanes (coins, barriers)
  const scrollSpeed = 300;
  for (let lane = 0; lane < 3; lane++) {
    const cx = lane * laneW + laneW / 2;
    for (let obj = 0; obj < 6; obj++) {
      const baseY = obj * 350 + lane * 90;
      const y = ((baseY - t * scrollSpeed) % (H * 1.8 + 400)) + H * 0.2;
      if (y < H * 0.35 || y > H + 40) continue;

      const kind = (lane + obj) % 4;
      if (kind === 0) {
        // Coin
        ctx.beginPath();
        ctx.arc(cx, y, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.fillStyle = '#92400e';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('$', cx, y + 6);
      } else if (kind === 1) {
        // Barrier (red box)
        drawRoundedRect(ctx, cx - 30, y - 20, 60, 40, 6);
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', cx, y + 5);
      } else if (kind === 2) {
        // Power-up (green diamond)
        ctx.save();
        ctx.translate(cx, y);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-14, -14, 28, 28);
        ctx.restore();
      } else {
        // Train car
        drawRoundedRect(ctx, cx - 40, y - 25, 80, 50, 8);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.fillStyle = '#bfdbfe';
        ctx.fillRect(cx - 30, y - 15, 20, 15);
        ctx.fillRect(cx + 10, y - 15, 20, 15);
      }
    }
  }
  ctx.textAlign = 'start';

  // Buildings at top
  for (let i = 0; i < 10; i++) {
    const bx = i * (W / 10);
    const bh = 80 + (i * 37 % 100);
    const by = H * 0.4 - bh;
    ctx.fillStyle = `hsl(${210 + i * 20}, 30%, ${25 + i * 3}%)`;
    ctx.fillRect(bx, by, W / 10 - 4, bh);
    // Windows
    ctx.fillStyle = '#fbbf24';
    for (let wy = by + 10; wy < by + bh - 10; wy += 20) {
      for (let wx = bx + 6; wx < bx + W / 10 - 10; wx += 14) {
        if ((wx + wy + Math.floor(t)) % 3 !== 0) {
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
    }
  }

  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 0, W, H);
}

function drawBgGTA(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  // Night sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#0f0a1a');
  sky.addColorStop(0.3, '#1a1035');
  sky.addColorStop(0.6, '#1e1545');
  sky.addColorStop(1, '#2d1f5e');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Stars
  for (let i = 0; i < 60; i++) {
    const sx = (i * 73 + 11) % W;
    const sy = (i * 47 + 23) % (H * 0.35);
    const twinkle = Math.sin(t * 2 + i) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.7})`;
    ctx.fillRect(sx, sy, 2, 2);
  }

  // Moon
  ctx.beginPath();
  ctx.arc(W * 0.15, H * 0.08, 35, 0, Math.PI * 2);
  ctx.fillStyle = '#e2e8f0';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(W * 0.15 + 10, H * 0.08 - 5, 30, 0, Math.PI * 2);
  ctx.fillStyle = '#0f0a1a';
  ctx.fill();

  // City silhouette
  const skylineY = H * 0.3;
  ctx.fillStyle = '#1a1a2e';
  const buildings = [
    [0, 120], [0.08, 180], [0.16, 140], [0.22, 220], [0.3, 160],
    [0.38, 250], [0.46, 130], [0.52, 200], [0.6, 170], [0.68, 190],
    [0.76, 230], [0.84, 150], [0.92, 180],
  ];
  for (const [pct, h] of buildings) {
    const bx = pct! * W;
    const bw = W * 0.08;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(bx, skylineY - h!, bw, h!);
    // Lit windows
    ctx.fillStyle = '#fbbf24';
    for (let wy = skylineY - h! + 8; wy < skylineY - 5; wy += 16) {
      for (let wx = bx + 5; wx < bx + bw - 5; wx += 12) {
        if ((Math.floor(wx + wy + t * 0.3)) % 5 !== 0) {
          ctx.fillStyle = ((wx + wy) | 0) % 3 === 0 ? '#fbbf24' : '#f59e0b';
          ctx.fillRect(wx, wy, 6, 8);
        }
      }
    }
  }

  // Road
  const roadTop = H * 0.5;
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, roadTop, W, H - roadTop);

  // Road shoulder
  ctx.fillStyle = '#374151';
  ctx.fillRect(0, roadTop, W, 6);
  ctx.fillRect(0, H - 6, W, 6);

  // Lane markings (scrolling)
  ctx.fillStyle = '#fbbf24';
  const dashLen = 60;
  const gapLen = 40;
  const period = dashLen + gapLen;
  const scrollOffset = (t * 250) % period;
  const roadH = H - roadTop;
  const lanePositions = [0.33, 0.5, 0.67];

  for (const lp of lanePositions) {
    const lx = W * lp - 2;
    for (let dy = -period; dy < roadH + period; dy += period) {
      const drawY = roadTop + dy - scrollOffset;
      if (lp === 0.5) {
        // Center lane: solid yellow double line
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(lx - 3, drawY, 2, dashLen);
        ctx.fillRect(lx + 3, drawY, 2, dashLen);
      } else {
        // Dashed white
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.fillRect(lx, drawY, 4, dashLen);
      }
    }
  }

  // Scrolling car silhouettes
  for (let i = 0; i < 3; i++) {
    const carLane = [0.22, 0.75, 0.42][i]!;
    const carSpeed = [180, 120, 200][i]!;
    const carY = ((i * 500 - t * carSpeed) % (roadH + 300)) + roadTop;
    if (carY < roadTop - 60 || carY > H + 60) continue;
    const carX = W * carLane;

    // Car body
    ctx.fillStyle = ['#ef4444', '#3b82f6', '#a855f7'][i]!;
    drawRoundedRect(ctx, carX - 20, carY - 25, 40, 70, 8);
    ctx.fill();
    // Headlights / taillights
    ctx.fillStyle = i === 0 ? '#fbbf24' : '#ef4444';
    ctx.fillRect(carX - 15, carY - 25, 8, 4);
    ctx.fillRect(carX + 7, carY - 25, 8, 4);
  }

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(0, 0, W, H);
}

function drawBgSatisfying(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  // Base gradient that shifts over time
  const hue1 = (t * 20) % 360;
  const hue2 = (hue1 + 60) % 360;
  const hue3 = (hue1 + 180) % 360;

  const bg = ctx.createLinearGradient(
    W * 0.5 + Math.sin(t * 0.5) * W * 0.3,
    0,
    W * 0.5 + Math.cos(t * 0.3) * W * 0.3,
    H,
  );
  bg.addColorStop(0, `hsl(${hue1}, 70%, 25%)`);
  bg.addColorStop(0.5, `hsl(${hue2}, 60%, 30%)`);
  bg.addColorStop(1, `hsl(${hue3}, 65%, 20%)`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Morphing gradient blobs
  const blobs = [
    { cx: 0.3, cy: 0.2, r: 0.25, speed: 0.7, hueOff: 0, phase: 0 },
    { cx: 0.7, cy: 0.5, r: 0.3, speed: 0.5, hueOff: 90, phase: 1 },
    { cx: 0.4, cy: 0.8, r: 0.22, speed: 0.9, hueOff: 180, phase: 2 },
    { cx: 0.8, cy: 0.2, r: 0.18, speed: 0.6, hueOff: 45, phase: 3.5 },
    { cx: 0.2, cy: 0.6, r: 0.2, speed: 0.8, hueOff: 270, phase: 5 },
    { cx: 0.6, cy: 0.35, r: 0.28, speed: 0.4, hueOff: 135, phase: 4 },
  ];

  for (const blob of blobs) {
    const bx = W * blob.cx + Math.sin(t * blob.speed + blob.phase) * W * 0.15;
    const by = H * blob.cy + Math.cos(t * blob.speed * 0.8 + blob.phase) * H * 0.12;
    const br = Math.min(W, H) * blob.r * (0.8 + Math.sin(t * blob.speed * 1.2 + blob.phase) * 0.2);
    const hue = (hue1 + blob.hueOff) % 360;

    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    grad.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.4)`);
    grad.addColorStop(0.5, `hsla(${hue}, 70%, 50%, 0.15)`);
    grad.addColorStop(1, `hsla(${hue}, 60%, 40%, 0)`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // Flowing particles
  for (let i = 0; i < 20; i++) {
    const px = (W * ((i * 0.073 + t * 0.02 * (1 + (i % 3) * 0.3)) % 1));
    const py = (H * ((i * 0.091 + t * 0.015 * (1 + (i % 4) * 0.2)) % 1));
    const pr = 4 + (i % 5) * 3;
    const alpha = 0.15 + Math.sin(t * 2 + i) * 0.1;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fill();
  }
}

function drawBgSolid(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, colors: string[]) {
  const shift = (t * 0.3) % 1;
  const grad = ctx.createLinearGradient(
    0,
    0,
    W * Math.sin(shift * Math.PI * 2) * 0.3 + W * 0.5,
    H,
  );
  grad.addColorStop(0, colors[0]!);
  grad.addColorStop(0.5, colors[1]!);
  grad.addColorStop(1, colors[2]!);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Floating particles
  for (let i = 0; i < 15; i++) {
    const px = ((i * 137 + t * 40 * (i % 3 + 1)) % W);
    const py = ((i * 211 + t * 20 * ((i + 1) % 3 + 1)) % H);
    const radius = 3 + (i % 5) * 2;
    ctx.beginPath();
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,255,255,${0.05 + (i % 3) * 0.03})`;
    ctx.fill();
  }
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  styleId: BgStyleId,
  colors: string[],
) {
  switch (styleId) {
    case 'minecraft':
      drawBgMinecraft(ctx, W, H, t);
      break;
    case 'subway':
      drawBgSubway(ctx, W, H, t);
      break;
    case 'gta':
      drawBgGTA(ctx, W, H, t);
      break;
    case 'satisfying':
      drawBgSatisfying(ctx, W, H, t);
      break;
    case 'solid':
    default:
      drawBgSolid(ctx, W, H, t, colors);
      break;
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Reddit Card Renderer — dark-themed, full featured
   ═══════════════════════════════════════════════════════════════════════════ */

function drawRedditCard(
  ctx: CanvasRenderingContext2D,
  post: RedditPostData,
  W: number,
  H: number,
  fontSize: number,
  currentWordIndex: number,
  totalWords: number,
  showComments: boolean,
  activeCommentIdx: number,
  t: number,
) {
  const pad = Math.round(W * 0.05);
  const cardX = pad;
  const cardW = W - pad * 2;
  const cardRadius = Math.round(W * 0.022);
  const font = (weight: string, size: number) =>
    `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;

  // ─── Measure card height ───
  ctx.font = font('bold', fontSize + 4);
  const titleLines = wrapText(ctx, post.title, cardW - pad * 2 - 60, fontSize + 12);
  ctx.font = font('normal', fontSize);
  const bodyText = post.body || '';
  const bodyLines = bodyText ? wrapText(ctx, bodyText, cardW - pad * 2, fontSize + 8) : [];

  const headerH = 70;
  const awardsH = 44;
  const titleH = titleLines.length * (fontSize + 12) + 16;
  const maxBodyLines = Math.min(bodyLines.length, showComments ? 6 : 14);
  const bodyH = bodyText ? maxBodyLines * (fontSize + 8) + 16 : 0;
  const footerH = 60;
  const cardH = headerH + awardsH + titleH + bodyH + footerH + 30;

  const cardY = Math.max(pad * 2, Math.round((H - cardH) * 0.3));

  // ─── Card background (dark theme) ───
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.fillStyle = '#1a1a1b';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Subtle border
  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
  ctx.strokeStyle = '#343536';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  let cy = cardY + 24;

  // ─── Header: subreddit icon + name + author + timestamp ───
  // Subreddit icon circle
  const iconR = 18;
  const iconX = cardX + pad + iconR;
  ctx.beginPath();
  ctx.arc(iconX, cy + iconR, iconR, 0, Math.PI * 2);
  ctx.fillStyle = '#ff4500';
  ctx.fill();
  // "r/" text inside icon
  ctx.font = font('bold', 16);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.fillText('r/', iconX, cy + iconR + 5);
  ctx.textAlign = 'start';

  const textX = iconX + iconR + 12;
  ctx.font = font('bold', 18);
  ctx.fillStyle = '#d7dadc';
  ctx.fillText(post.subreddit, textX, cy + 14);

  ctx.font = font('normal', 14);
  ctx.fillStyle = '#818384';
  ctx.fillText(`u/${post.author} \u00b7 Posted 5 hours ago`, textX, cy + 34);

  cy += headerH;

  // ─── Award badges ───
  let ax = cardX + pad;
  for (let i = 0; i < AWARDS.length; i++) {
    const award = AWARDS[i]!;
    const count = Math.max(1, ((hashStr(post.title) >> (i * 4)) & 7));

    // Badge pill
    drawRoundedRect(ctx, ax, cy, 70, 28, 14);
    ctx.fillStyle = `${award.color}22`;
    ctx.fill();
    drawRoundedRect(ctx, ax, cy, 70, 28, 14);
    ctx.strokeStyle = `${award.color}55`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = font('normal', 16);
    ctx.fillStyle = award.color;
    ctx.fillText(award.icon, ax + 8, cy + 20);

    ctx.font = font('bold', 13);
    ctx.fillStyle = '#818384';
    ctx.fillText(`${award.name} ${count}`, ax + 28, cy + 19);

    ax += 80;
  }

  cy += awardsH;

  // ─── Title ───
  ctx.font = font('bold', fontSize + 4);
  for (let i = 0; i < titleLines.length; i++) {
    ctx.fillStyle = '#d7dadc';
    ctx.fillText(titleLines[i]!, cardX + pad, cy + i * (fontSize + 12));
  }
  cy += titleH;

  // ─── Body text with word-by-word highlight ───
  if (bodyText && !showComments) {
    ctx.font = font('normal', fontSize);
    const bodyWords = bodyText.split(/\s+/);
    let wordIdx = 0;
    let lineStr = '';
    let lineY = cy;

    for (let w = 0; w < bodyWords.length; w++) {
      const word = bodyWords[w]!;
      const test = lineStr ? `${lineStr} ${word}` : word;
      const tw = ctx.measureText(test).width;

      if (tw > cardW - pad * 2 && lineStr) {
        lineY += fontSize + 8;
        lineStr = word;
        if (lineY - cy > maxBodyLines * (fontSize + 8)) break;
      } else {
        lineStr = test;
      }

      // Compute X for this word
      const prefix = lineStr.slice(0, lineStr.lastIndexOf(word));
      const wordX = ctx.measureText(prefix).width + cardX + pad;

      const isHighlighted = wordIdx < currentWordIndex;
      const isActive = wordIdx === currentWordIndex;

      if (isActive) {
        const ww = ctx.measureText(word).width;
        ctx.fillStyle = 'rgba(255,69,0,0.25)';
        drawRoundedRect(ctx, wordX - 4, lineY - fontSize + 2, ww + 8, fontSize + 6, 4);
        ctx.fill();
        ctx.fillStyle = '#ff4500';
      } else {
        ctx.fillStyle = isHighlighted ? '#d7dadc' : '#818384';
      }
      ctx.fillText(word, wordX, lineY);
      wordIdx++;
    }
    cy += bodyH;
  }

  // ─── Footer: votes + comments count ───
  const footerY = cardY + cardH - 44;

  // Upvote arrow
  ctx.beginPath();
  ctx.moveTo(cardX + pad, footerY + 10);
  ctx.lineTo(cardX + pad + 10, footerY - 4);
  ctx.lineTo(cardX + pad + 20, footerY + 10);
  ctx.fillStyle = '#ff4500';
  ctx.fill();

  // Vote count
  ctx.font = font('bold', 16);
  ctx.fillStyle = '#d7dadc';
  ctx.fillText(formatUpvotes(post.upvotes), cardX + pad + 26, footerY + 10);

  // Downvote arrow
  const downX = cardX + pad + 26 + ctx.measureText(formatUpvotes(post.upvotes)).width + 14;
  ctx.beginPath();
  ctx.moveTo(downX, footerY - 2);
  ctx.lineTo(downX + 10, footerY + 12);
  ctx.lineTo(downX + 20, footerY - 2);
  ctx.fillStyle = '#818384';
  ctx.fill();

  // Comment icon + count
  const commIconX = downX + 40;
  ctx.fillStyle = '#818384';
  ctx.font = font('normal', 14);
  // Speech bubble icon approximation
  drawRoundedRect(ctx, commIconX, footerY - 4, 18, 14, 3);
  ctx.strokeStyle = '#818384';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Tail
  ctx.beginPath();
  ctx.moveTo(commIconX + 4, footerY + 10);
  ctx.lineTo(commIconX + 2, footerY + 16);
  ctx.lineTo(commIconX + 10, footerY + 10);
  ctx.fillStyle = '#1a1a1b';
  ctx.fill();
  ctx.strokeStyle = '#818384';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = font('normal', 14);
  ctx.fillStyle = '#818384';
  ctx.fillText(`${post.commentCount} Comments`, commIconX + 24, footerY + 10);

  // Share text
  const shareX = commIconX + 24 + ctx.measureText(`${post.commentCount} Comments`).width + 24;
  ctx.fillText('Share', shareX, footerY + 10);

  const cardBottom = cardY + cardH;

  // ─── Comments section (if in comment mode) ───
  if (showComments && post.comments.length > 0) {
    let commY = cardBottom + 16;
    const commCardW = cardW;

    for (let ci = 0; ci < post.comments.length; ci++) {
      if (commY > H - pad * 2) break;
      const comment = post.comments[ci]!;

      ctx.font = font('normal', fontSize - 2);
      const cLines = wrapText(ctx, comment.body, commCardW - pad * 2 - 50, fontSize + 4);
      const cH = Math.min(cLines.length, 5) * (fontSize + 4) + 50;

      // Highlight the active comment
      const isActive = ci === activeCommentIdx;

      // Comment card
      drawRoundedRect(ctx, cardX, commY, commCardW, cH, cardRadius);
      ctx.fillStyle = isActive ? '#272729' : '#1a1a1b';
      ctx.fill();
      drawRoundedRect(ctx, cardX, commY, commCardW, cH, cardRadius);
      ctx.strokeStyle = isActive ? '#ff4500' : '#343536';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.stroke();

      // Avatar circle with initial
      const avatarX = cardX + pad + 14;
      const avatarY = commY + 22;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, 14, 0, Math.PI * 2);
      ctx.fillStyle = avatarColor(comment.author);
      ctx.fill();
      ctx.font = font('bold', 14);
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.fillText(comment.author.charAt(0).toUpperCase(), avatarX, avatarY + 5);
      ctx.textAlign = 'start';

      // Username
      ctx.font = font('bold', 14);
      ctx.fillStyle = '#d7dadc';
      ctx.fillText(`u/${comment.author}`, avatarX + 22, commY + 18);

      // Upvotes + time
      ctx.font = font('normal', 12);
      ctx.fillStyle = '#818384';
      ctx.fillText(`${formatUpvotes(comment.upvotes)} pts \u00b7 3h`, avatarX + 22, commY + 36);

      // Comment text
      ctx.font = font('normal', fontSize - 2);
      const maxCLines = Math.min(cLines.length, 5);
      for (let li = 0; li < maxCLines; li++) {
        ctx.fillStyle = isActive ? '#d7dadc' : '#818384';
        ctx.fillText(cLines[li]!, cardX + pad, commY + 52 + li * (fontSize + 4));
      }

      commY += cH + 10;
    }
  }

  // ─── Reading progress bar at bottom ───
  const progBarY = H - pad - 10;
  drawRoundedRect(ctx, pad, progBarY, W - pad * 2, 6, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fill();

  const prog = Math.max(0, Math.min(1, currentWordIndex / Math.max(totalWords, 1)));
  if (prog > 0) {
    drawRoundedRect(ctx, pad, progBarY, (W - pad * 2) * prog, 6, 3);
    ctx.fillStyle = '#ff4500';
    ctx.fill();
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════════ */

export function RedditVideoGenerator() {
  const C = useThemeStore((s) => s.theme);

  // Input state
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url');
  const [redditUrl, setRedditUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualText, setManualText] = useState('');
  const [manualComments, setManualComments] = useState('');

  // Options
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [voicePreset, setVoicePreset] = useState('normal');
  const [bgStyle, setBgStyle] = useState<BgStyleId>('minecraft');
  const [fontSize, setFontSize] = useState(28);
  const [videoFormatId, setVideoFormatId] = useState('9:16');
  const [showWatermark, setShowWatermark] = useState(true);
  const [commentMode, setCommentMode] = useState(false);

  // Voices from browser
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [estimatedRemaining, setEstimatedRemaining] = useState('');
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const abortRef = useRef(false);

  // Load voices
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      const english = voices.filter((v) => v.lang.startsWith('en'));
      setAvailableVoices(english.length > 0 ? english : voices);
    }
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const videoFormat = VIDEO_FORMATS.find((f) => f.id === videoFormatId) ?? VIDEO_FORMATS[0]!;
  const currentVoicePreset = VOICE_PRESETS.find((p) => p.id === voicePreset) ?? VOICE_PRESETS[0]!;

  const canGenerate =
    inputMode === 'url' ? isValidRedditUrl(redditUrl) : manualText.trim().length > 0;

  /* ── Main generation pipeline ── */

  const handleGenerate = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setProgress(0);
    setError('');
    setVideoUrl(null);
    setEstimatedRemaining('');
    abortRef.current = false;
    const genStartTime = Date.now();

    try {
      /* Step 1 — Obtain post data */
      setStatusText('Fetching Reddit post...');
      setProgress(5);

      let postData: RedditPostData;

      if (inputMode === 'url') {
        postData = await fetchRedditPost(redditUrl);
      } else {
        const manualCommList: RedditComment[] = manualComments
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((body, i) => ({
            author: `user_${i + 1}`,
            body,
            upvotes: Math.floor(Math.random() * 500) + 10,
          }));

        postData = {
          title: manualTitle || 'Untitled Post',
          body: manualText,
          subreddit: 'r/stories',
          author: 'you',
          upvotes: Math.floor(Math.random() * 10000) + 100,
          commentCount: manualCommList.length,
          comments: manualCommList,
        };
      }

      if (abortRef.current) return;

      /* Step 2 — Prepare TTS text */
      setStatusText('Preparing narration...');
      setProgress(10);

      let narrationParts: string[];
      if (commentMode && postData.comments.length > 0) {
        narrationParts = [postData.title];
        postData.comments.forEach((c) => {
          narrationParts.push(c.body);
        });
      } else {
        narrationParts = [postData.title];
        if (postData.body) narrationParts.push(postData.body);
      }
      const fullNarration = narrationParts.join('. ');
      const allWords = fullNarration.split(/\s+/).filter(Boolean);

      // Estimate duration based on voice preset rate
      const estimatedWordRate = 2.5 * currentVoicePreset.rate; // words per second
      const estimatedDuration = allWords.length / estimatedWordRate;

      /* Step 3 — Set up canvas */
      setStatusText('Setting up canvas...');
      setProgress(15);

      const WIDTH = videoFormat.width;
      const HEIGHT = videoFormat.height;
      const canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d')!;
      canvasRef.current = canvas;

      const bgDef = BACKGROUND_STYLES.find((b) => b.id === bgStyle) ?? BACKGROUND_STYLES[0]!;

      /* Step 4 — Speak + record simultaneously */
      setStatusText('Generating video with narration...');
      setProgress(20);

      const stream = canvas.captureStream(30);

      // Try audio
      let audioCtx: AudioContext | null = null;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      try {
        audioCtx = new AudioContext();
        audioDestination = audioCtx.createMediaStreamDestination();
        audioDestination.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch {
        // silent video
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_000_000 });
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

      /* Step 5 — Animate + TTS */
      let currentWordIndex = 0;
      let ttsFinished = false;
      const wordTimestamps: number[] = [];
      const startTime = performance.now();

      // Figure out which comment is active (for comment mode)
      // Build word-count boundaries per narration section
      const sectionWordCounts: number[] = narrationParts.map((p) => p.split(/\s+/).filter(Boolean).length);
      const sectionBoundaries: number[] = [];
      let runningCount = 0;
      for (const wc of sectionWordCounts) {
        runningCount += wc;
        sectionBoundaries.push(runningCount);
      }

      function getActiveCommentIdx(wordIdx: number): number {
        // Section 0 is the title, sections 1+ are comments
        for (let i = 0; i < sectionBoundaries.length; i++) {
          if (wordIdx < sectionBoundaries[i]!) return Math.max(0, i - 1);
        }
        return Math.max(0, sectionBoundaries.length - 2);
      }

      const utterance = new SpeechSynthesisUtterance(fullNarration);
      const selectedVoice = availableVoices[selectedVoiceIdx];
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = currentVoicePreset.rate;
      utterance.pitch = currentVoicePreset.pitch;

      utterance.onboundary = (e) => {
        if (e.name === 'word') {
          const elapsed = performance.now() - startTime;
          wordTimestamps.push(elapsed);
          currentWordIndex = wordTimestamps.length;
        }
      };

      const ttsPromise = new Promise<void>((resolve) => {
        utterance.onend = () => {
          ttsFinished = true;
          resolve();
        };
        utterance.onerror = () => {
          ttsFinished = true;
          resolve();
        };
      });

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);

      // Animation loop
      const animationDone = new Promise<void>((resolve) => {
        function draw() {
          if (abortRef.current) {
            resolve();
            return;
          }

          const elapsed = (performance.now() - startTime) / 1000;

          // ─── Draw animated background ───
          drawBackground(ctx, WIDTH, HEIGHT, elapsed, bgDef.id as BgStyleId, bgDef.colors);

          // ─── Draw Reddit card ───
          const activeComment = commentMode ? getActiveCommentIdx(currentWordIndex) : -1;
          drawRedditCard(
            ctx,
            postData,
            WIDTH,
            HEIGHT,
            fontSize,
            currentWordIndex,
            allWords.length,
            commentMode,
            activeComment,
            elapsed,
          );

          // ─── Watermark ───
          if (showWatermark) {
            ctx.font = `bold ${Math.round(WIDTH * 0.016)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.textAlign = 'end';
            ctx.fillText('TubeForge', WIDTH - Math.round(WIDTH * 0.04), HEIGHT - Math.round(HEIGHT * 0.03));
            ctx.textAlign = 'start';
          }

          // ─── Update progress + estimated time ───
          if (!ttsFinished) {
            const p = 20 + (currentWordIndex / Math.max(allWords.length, 1)) * 70;
            setProgress(Math.min(p, 90));

            const elapsedSec = (Date.now() - genStartTime) / 1000;
            const fraction = currentWordIndex / Math.max(allWords.length, 1);
            if (fraction > 0.05) {
              const totalEstimate = elapsedSec / fraction;
              const remaining = Math.max(0, totalEstimate - elapsedSec);
              setEstimatedRemaining(`~${Math.ceil(remaining)}s remaining`);
            }

            setStatusText(`Rendering... ${Math.round(Math.min(p, 90))}%`);
          }

          // Estimate words if boundary events don't fire
          if (!ttsFinished && elapsed < 300 && !abortRef.current) {
            if (wordTimestamps.length === 0 && elapsed > 1) {
              currentWordIndex = Math.min(
                Math.floor(elapsed * estimatedWordRate),
                allWords.length,
              );
            }
            requestAnimationFrame(draw);
          } else {
            currentWordIndex = allWords.length;
            resolve();
          }
        }

        requestAnimationFrame(draw);
      });

      await Promise.all([ttsPromise, animationDone]);

      if (abortRef.current) {
        recorder.stop();
        return;
      }

      // Final frames
      setStatusText('Finalizing video...');
      setProgress(92);
      setEstimatedRemaining('~3s remaining');
      const finalStart = performance.now();
      await new Promise<void>((resolve) => {
        function finalFrames() {
          const elapsed = (performance.now() - startTime) / 1000;
          const fe = (performance.now() - finalStart) / 1000;

          drawBackground(ctx, WIDTH, HEIGHT, elapsed, bgDef.id as BgStyleId, bgDef.colors);

          // "Thanks for watching" fade in
          const alpha = Math.min(1, fe / 0.5);
          ctx.font = `bold ${Math.round(WIDTH * 0.044)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
          ctx.textAlign = 'center';
          ctx.fillText('Thanks for watching!', WIDTH / 2, HEIGHT / 2);
          ctx.font = `${Math.round(WIDTH * 0.022)}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
          ctx.fillText('Made with TubeForge', WIDTH / 2, HEIGHT / 2 + Math.round(WIDTH * 0.05));
          ctx.textAlign = 'start';

          if (fe < 1.5) {
            requestAnimationFrame(finalFrames);
          } else {
            resolve();
          }
        }
        requestAnimationFrame(finalFrames);
      });

      // Stop recording
      setStatusText('Encoding video...');
      setProgress(95);
      setEstimatedRemaining('~2s remaining');
      recorder.stop();
      const videoBlob = await recordingDone;

      if (abortRef.current) return;

      if (audioCtx) {
        try { await audioCtx.close(); } catch { /* ignore */ }
      }

      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setProgress(100);
      setStatusText('Done!');
      setEstimatedRemaining('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setStatusText('');
      setEstimatedRemaining('');
      window.speechSynthesis?.cancel();
    } finally {
      setLoading(false);
    }
  }, [
    loading, inputMode, redditUrl, manualTitle, manualText, manualComments,
    availableVoices, selectedVoiceIdx, voicePreset, currentVoicePreset,
    bgStyle, fontSize, videoFormat, showWatermark, commentMode,
  ]);

  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `reddit-video-${videoFormatId.replace(':', 'x')}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [videoUrl, videoFormatId]);

  const handleCancel = useCallback(() => {
    abortRef.current = true;
    window.speechSynthesis?.cancel();
    setLoading(false);
    setStatusText('Cancelled');
    setEstimatedRemaining('');
  }, []);

  /* ═══════════════════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════════════════ */

  const inputStyle = (extra?: React.CSSProperties): React.CSSProperties => ({
    width: '100%',
    padding: '12px 14px',
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: C.card,
    color: C.text,
    fontSize: 14,
    boxSizing: 'border-box' as const,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.2s ease',
    ...extra,
  });

  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: C.text,
    marginBottom: 8,
    display: 'block',
  };

  const sectionStyle: React.CSSProperties = {
    padding: '16px',
    borderRadius: 14,
    border: `1px solid ${C.border}`,
    background: C.surface,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };

  return (
    <ToolPageShell
      title="Reddit Video Generator"
      subtitle="Turn Reddit posts into viral short-form videos with AI narration"
      gradient={GRADIENT}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
        gap: 24,
      }}>
        {/* ──── Left column: controls ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ─── Input mode toggle ─── */}
          <div style={{
            display: 'flex', borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${C.border}`,
          }}>
            {(['url', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                style={{
                  flex: 1, padding: '12px 0', border: 'none', minHeight: 44,
                  background: inputMode === mode
                    ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                    : C.card,
                  color: inputMode === mode ? '#fff' : C.sub,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => { if (inputMode !== mode) e.currentTarget.style.background = C.cardHover; }}
                onMouseLeave={(e) => { if (inputMode !== mode) e.currentTarget.style.background = C.card; }}
              >
                {mode === 'url' ? 'Reddit Post URL' : 'Manual Text Input'}
              </button>
            ))}
          </div>

          {/* ─── URL or Manual input ─── */}
          {inputMode === 'url' ? (
            <div>
              <label style={labelStyle}>Reddit Post URL</label>
              <input
                value={redditUrl}
                onChange={(e) => setRedditUrl(e.target.value)}
                placeholder="https://www.reddit.com/r/AskReddit/comments/..."
                style={inputStyle()}
                onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
              />
              {redditUrl.trim().length > 0 && !isValidRedditUrl(redditUrl) && (
                <p style={{ fontSize: 12, color: C.red ?? '#ef4444', marginTop: 6, marginBottom: 0 }}>
                  Enter a valid Reddit post URL (e.g. https://www.reddit.com/r/subreddit/comments/...)
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={labelStyle}>Post Title</label>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Enter a title for the Reddit post..."
                  style={inputStyle()}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Post Content</label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Enter the text content of the Reddit post..."
                  rows={5}
                  style={inputStyle({ resize: 'vertical' as const })}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Comments (one per line, optional)</label>
                <textarea
                  value={manualComments}
                  onChange={(e) => setManualComments(e.target.value)}
                  placeholder={"Best comment ever!\nI totally agree with this.\nUnpopular opinion but..."}
                  rows={3}
                  style={inputStyle({ resize: 'vertical' as const })}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
            </div>
          )}

          {/* ─── Video Format Selection ─── */}
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Video Format</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
              {VIDEO_FORMATS.map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => setVideoFormatId(fmt.id)}
                  style={{
                    padding: '12px 8px', borderRadius: 10, minHeight: 44,
                    border: videoFormatId === fmt.id
                      ? `2px solid ${GRADIENT[0]}`
                      : `1px solid ${C.border}`,
                    background: videoFormatId === fmt.id ? `${GRADIENT[0]}15` : C.card,
                    color: C.text, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s ease', textAlign: 'center',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  }}
                  onMouseEnter={(e) => { if (videoFormatId !== fmt.id) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (videoFormatId !== fmt.id) e.currentTarget.style.background = videoFormatId === fmt.id ? `${GRADIENT[0]}15` : C.card; }}
                >
                  {/* Aspect ratio preview box */}
                  <div style={{
                    width: fmt.id === '9:16' ? 22 : fmt.id === '1:1' ? 30 : 40,
                    height: fmt.id === '9:16' ? 38 : fmt.id === '1:1' ? 30 : 24,
                    borderRadius: 3,
                    border: `2px solid ${videoFormatId === fmt.id ? GRADIENT[0] : C.dim}`,
                    marginBottom: 2,
                  }} />
                  <span style={{ fontWeight: 700 }}>{fmt.id}</span>
                  <span style={{ fontSize: 10, color: C.sub, fontWeight: 400 }}>{fmt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ─── Background Style ─── */}
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Background Style</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))', gap: 8 }}>
              {BACKGROUND_STYLES.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setBgStyle(bg.id)}
                  style={{
                    padding: '14px 12px', borderRadius: 12, minHeight: 44,
                    border: bgStyle === bg.id ? `2px solid ${bg.colors[0]}` : `1px solid ${C.border}`,
                    background: bgStyle === bg.id ? `${bg.colors[0]}15` : C.card,
                    color: C.text, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    fontFamily: 'inherit', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}
                  onMouseEnter={(e) => { if (bgStyle !== bg.id) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (bgStyle !== bg.id) e.currentTarget.style.background = bgStyle === bg.id ? `${bg.colors[0]}15` : C.card; }}
                >
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]}, ${bg.colors[2]})`,
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14,
                  }}>
                    {bg.emoji}
                  </span>
                  <span>{bg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ─── Voice Settings ─── */}
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              Voice Settings ({availableVoices.length} voices)
            </label>

            {availableVoices.length > 0 ? (
              <>
                <select
                  value={selectedVoiceIdx}
                  onChange={(e) => setSelectedVoiceIdx(Number(e.target.value))}
                  style={inputStyle({ cursor: 'pointer' })}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                >
                  {availableVoices.map((v, i) => (
                    <option key={`${v.name}-${v.lang}`} value={i}>
                      {v.name} ({v.lang})
                    </option>
                  ))}
                </select>

                {/* Voice presets */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 6 }}>
                  {VOICE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => setVoicePreset(preset.id)}
                      style={{
                        padding: '10px 4px', borderRadius: 8, minHeight: 44,
                        border: voicePreset === preset.id
                          ? `2px solid ${GRADIENT[0]}`
                          : `1px solid ${C.border}`,
                        background: voicePreset === preset.id ? `${GRADIENT[0]}15` : C.card,
                        color: voicePreset === preset.id ? GRADIENT[0] : C.text,
                        fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.2s ease', textAlign: 'center',
                      }}
                      onMouseEnter={(e) => { if (voicePreset !== preset.id) e.currentTarget.style.background = C.cardHover; }}
                      onMouseLeave={(e) => { if (voicePreset !== preset.id) e.currentTarget.style.background = voicePreset === preset.id ? `${GRADIENT[0]}15` : C.card; }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    const u = new SpeechSynthesisUtterance('This is a preview of the selected voice.');
                    const voice = availableVoices[selectedVoiceIdx];
                    if (voice) u.voice = voice;
                    u.rate = currentVoicePreset.rate;
                    u.pitch = currentVoicePreset.pitch;
                    window.speechSynthesis.speak(u);
                  }}
                  style={{
                    padding: '10px 14px', borderRadius: 8, minHeight: 44,
                    border: `1px solid ${C.border}`, background: C.card,
                    color: C.text, fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s ease', alignSelf: 'flex-start',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
                >
                  Preview Voice
                </button>
              </>
            ) : (
              <p style={{ fontSize: 12, color: C.dim, margin: 0 }}>
                No speech voices found in your browser. The video will be generated without audio narration.
              </p>
            )}
          </div>

          {/* ─── Comment Mode Toggle ─── */}
          <div style={{
            ...sectionStyle,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Comment Mode</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                Read comments one-by-one instead of post body
              </div>
            </div>
            <button
              onClick={() => setCommentMode(!commentMode)}
              style={{
                width: 48, height: 26, borderRadius: 13,
                border: 'none', cursor: 'pointer',
                background: commentMode
                  ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                  : C.border,
                position: 'relative', transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 10,
                background: '#fff',
                position: 'absolute', top: 3,
                left: commentMode ? 25 : 3,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>

          {/* ─── Watermark Toggle ─── */}
          <div style={{
            ...sectionStyle,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>TubeForge Watermark</div>
              <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>
                Show watermark in corner
              </div>
            </div>
            <button
              onClick={() => setShowWatermark(!showWatermark)}
              style={{
                width: 48, height: 26, borderRadius: 13,
                border: 'none', cursor: 'pointer',
                background: showWatermark
                  ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                  : C.border,
                position: 'relative', transition: 'background 0.2s ease',
                flexShrink: 0,
              }}
            >
              <div style={{
                width: 20, height: 20, borderRadius: 10,
                background: '#fff',
                position: 'absolute', top: 3,
                left: showWatermark ? 25 : 3,
                transition: 'left 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              }} />
            </button>
          </div>

          {/* ─── Font size slider ─── */}
          <div style={sectionStyle}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min={18}
              max={42}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{ width: '100%', accentColor: GRADIENT[0] }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim }}>
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          {/* ─── Error display ─── */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: `${C.red ?? '#ef4444'}12`,
              border: `1px solid ${C.red ?? '#ef4444'}30`,
              color: C.red ?? '#ef4444', fontSize: 13, fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {/* ─── Generate / Cancel buttons ─── */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <ActionButton
              label={loading ? 'Generating Video...' : 'Generate Video'}
              gradient={GRADIENT}
              onClick={handleGenerate}
              disabled={!canGenerate}
              loading={loading}
            />
            {loading && (
              <button
                onClick={handleCancel}
                style={{
                  padding: '12px 20px', borderRadius: 12,
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
        </div>

        {/* ──── Right column: preview + progress ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
              Video Preview
            </h3>
            <span style={{
              padding: '4px 12px', borderRadius: 8,
              background: `${GRADIENT[0]}18`, color: GRADIENT[0],
              fontSize: 11, fontWeight: 700,
            }}>
              {videoFormat.width}x{videoFormat.height} ({videoFormat.id})
            </span>
          </div>

          {/* Progress bar with estimate */}
          {(loading || progress > 0) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{
                width: '100%', height: 8, borderRadius: 4,
                background: C.surface, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  background: `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                  width: `${progress}%`,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: C.sub, fontWeight: 500 }}>
                  {statusText}
                  {estimatedRemaining && (
                    <span style={{ color: C.dim, marginLeft: 8 }}>
                      {estimatedRemaining}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 12, color: C.dim, fontWeight: 600 }}>
                  {Math.round(progress)}%
                </span>
              </div>
            </div>
          )}

          {/* Video player or placeholder */}
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
                style={{
                  width: '100%', maxHeight: 580,
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <div style={{
              width: '100%',
              aspectRatio: videoFormat.aspect,
              borderRadius: 14,
              border: `1px solid ${C.border}`,
              background: C.card,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              maxHeight: 580, position: 'relative', overflow: 'hidden',
            }}>
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: C.card,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 12,
                  zIndex: 2,
                }}>
                  <svg width="32" height="32" viewBox="0 0 16 16" style={{ animation: 'spin 1s linear infinite' }}>
                    <circle cx="8" cy="8" r="6" stroke={C.border} strokeWidth="2" fill="none" />
                    <path d="M8 2a6 6 0 014.47 2" stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                  <span style={{ fontSize: 13, color: C.sub, fontWeight: 600 }}>
                    {statusText || 'Generating video...'}
                  </span>
                  {estimatedRemaining && (
                    <span style={{ fontSize: 11, color: C.dim }}>
                      {estimatedRemaining}
                    </span>
                  )}
                </div>
              )}
              {!loading && (
                <>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="1.5" opacity={0.3}>
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                  </svg>
                  <p style={{ fontSize: 13, color: C.dim, marginTop: 12 }}>
                    Generated video will appear here
                  </p>
                </>
              )}
            </div>
          )}

          {/* Download button */}
          {videoUrl && (
            <button
              onClick={handleDownload}
              style={{
                padding: '12px 0', borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.card, color: C.text,
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = C.cardHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = C.card; }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Video (.webm)
            </button>
          )}

          {/* New video button */}
          {videoUrl && !loading && (
            <button
              onClick={() => {
                if (videoUrl) URL.revokeObjectURL(videoUrl);
                setVideoUrl(null);
                setProgress(0);
                setStatusText('');
                setEstimatedRemaining('');
                setError('');
              }}
              style={{
                padding: '10px 0', borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: 'transparent', color: C.sub,
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.text; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.sub; }}
            >
              Generate New Video
            </button>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
