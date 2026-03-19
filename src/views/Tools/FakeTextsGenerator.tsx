'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

/* ─── constants ─── */
const GRADIENT: [string, string] = ['#8b5cf6', '#6366f1'];

const PHONE_W = 390;
const PHONE_H = 844;
const BUBBLE_RADIUS = 18;
const SCREEN_PAD = 10;
const SCREEN_X = SCREEN_PAD;
const SCREEN_Y = SCREEN_PAD;
const SCREEN_W = PHONE_W - SCREEN_PAD * 2;
const SCREEN_H = PHONE_H - SCREEN_PAD * 2;
const HEADER_H = 90;
const INPUT_BAR_H = 56;
const MSG_AREA_X = SCREEN_X + 12;
const MSG_AREA_W = SCREEN_W - 24;
const MSG_AREA_TOP = SCREEN_Y + HEADER_H;
const MSG_AREA_BOTTOM = SCREEN_Y + SCREEN_H - INPUT_BAR_H;

/* ─── types ─── */
interface Message {
  id: string;
  text: string;
  sender: string;
  direction: 'sent' | 'received';
}

type PlatformStyleId = 'imessage' | 'whatsapp' | 'telegram';

interface PlatformStyle {
  id: PlatformStyleId;
  label: string;
  bgColor: string;
  headerColor: string;
  headerTextColor: string;
  sentColor: string;
  sentTextColor: string;
  receivedColor: string;
  receivedTextColor: string;
  inputBarBg: string;
  fontFamily: string;
  accentColor: string;
  statusBarColor: string;
  checkmarks: boolean;
}

const PLATFORM_STYLES: Record<PlatformStyleId, PlatformStyle> = {
  imessage: {
    id: 'imessage',
    label: 'iMessage',
    bgColor: '#f2f2f7',
    headerColor: '#f8f8fa',
    headerTextColor: '#000',
    sentColor: '#007AFF',
    sentTextColor: '#fff',
    receivedColor: '#e5e5ea',
    receivedTextColor: '#000',
    inputBarBg: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    accentColor: '#007AFF',
    statusBarColor: '#000',
    checkmarks: false,
  },
  whatsapp: {
    id: 'whatsapp',
    label: 'WhatsApp',
    bgColor: '#efeae2',
    headerColor: '#075e54',
    headerTextColor: '#fff',
    sentColor: '#dcf8c6',
    sentTextColor: '#303030',
    receivedColor: '#fff',
    receivedTextColor: '#303030',
    inputBarBg: '#f0f0f0',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
    accentColor: '#25D366',
    statusBarColor: '#054d44',
    checkmarks: true,
  },
  telegram: {
    id: 'telegram',
    label: 'Telegram',
    bgColor: '#c8d9e6',
    headerColor: '#517da2',
    headerTextColor: '#fff',
    sentColor: '#effdde',
    sentTextColor: '#000',
    receivedColor: '#fff',
    receivedTextColor: '#000',
    inputBarBg: '#fff',
    fontFamily: '"Roboto", "Helvetica Neue", sans-serif',
    accentColor: '#0088cc',
    statusBarColor: '#3e6d8e',
    checkmarks: true,
  },
};

const PLATFORM_IDS: PlatformStyleId[] = ['imessage', 'whatsapp', 'telegram'];

const PLATFORM_COLORS: Record<PlatformStyleId, string> = {
  imessage: '#007AFF',
  whatsapp: '#25D366',
  telegram: '#0088cc',
};

/* ─── canvas drawing helpers ─── */

function roundRect(
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
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? currentLine + ' ' + word : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  if (lines.length === 0) lines.push('');
  return lines;
}

function drawPhoneFrame(ctx: CanvasRenderingContext2D, style: PlatformStyle) {
  // Phone body
  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, 0, 0, PHONE_W, PHONE_H, 44);

  // Screen
  ctx.fillStyle = style.bgColor;
  roundRect(ctx, SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H, 38);
}

function drawStatusBar(ctx: CanvasRenderingContext2D, style: PlatformStyle) {
  const statusY = SCREEN_Y;
  const barH = 44;

  // Status bar background
  ctx.fillStyle = style.id === 'imessage' ? style.headerColor : style.statusBarColor;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(SCREEN_X + 38, statusY);
  ctx.lineTo(SCREEN_X + SCREEN_W - 38, statusY);
  ctx.arcTo(SCREEN_X + SCREEN_W, statusY, SCREEN_X + SCREEN_W, statusY + 38, 38);
  ctx.lineTo(SCREEN_X + SCREEN_W, statusY + barH);
  ctx.lineTo(SCREEN_X, statusY + barH);
  ctx.lineTo(SCREEN_X, statusY + 38);
  ctx.arcTo(SCREEN_X, statusY, SCREEN_X + 38, statusY, 38);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Notch (dynamic island)
  ctx.fillStyle = '#1a1a1a';
  roundRect(ctx, PHONE_W / 2 - 62, statusY + 8, 124, 28, 14);

  // Time
  ctx.fillStyle = style.id === 'imessage' ? '#000' : '#fff';
  ctx.font = `600 14px ${style.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.fillText('9:41', SCREEN_X + 20, statusY + 28);

  // Battery, signal
  ctx.fillStyle = style.id === 'imessage' ? '#000' : '#fff';
  ctx.font = `600 11px ${style.fontFamily}`;
  ctx.textAlign = 'right';
  ctx.fillText('5G', SCREEN_X + SCREEN_W - 44, statusY + 28);

  // Battery icon
  ctx.fillStyle = style.id === 'imessage' ? '#000' : '#fff';
  const bx = SCREEN_X + SCREEN_W - 38;
  const by = statusY + 19;
  roundRect(ctx, bx, by, 22, 10, 2);
  ctx.fillStyle = style.id === 'imessage' ? '#000' : '#fff';
  roundRect(ctx, bx + 22, by + 3, 2, 4, 1);
  // Battery fill
  ctx.fillStyle = '#34c759';
  roundRect(ctx, bx + 2, by + 2, 16, 6, 1);
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  style: PlatformStyle,
  contactName: string,
) {
  const headerY = SCREEN_Y + 44;
  const headerH = HEADER_H - 44;

  // Header background
  ctx.fillStyle = style.headerColor;
  ctx.fillRect(SCREEN_X, headerY, SCREEN_W, headerH);

  if (style.id === 'imessage') {
    // Back chevron
    ctx.strokeStyle = style.accentColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(SCREEN_X + 20, headerY + headerH / 2);
    ctx.lineTo(SCREEN_X + 12, headerY + headerH / 2);
    ctx.moveTo(SCREEN_X + 16, headerY + headerH / 2 - 6);
    ctx.lineTo(SCREEN_X + 10, headerY + headerH / 2);
    ctx.lineTo(SCREEN_X + 16, headerY + headerH / 2 + 6);
    ctx.stroke();

    // Avatar circle
    const ax = PHONE_W / 2;
    const ay = headerY + headerH / 2 - 4;
    ctx.fillStyle = '#c7c7cc';
    ctx.beginPath();
    ctx.arc(ax, ay, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 12px ${style.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(contactName.charAt(0).toUpperCase(), ax, ay + 1);

    // Name below
    ctx.fillStyle = '#000';
    ctx.font = `600 12px ${style.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(contactName || 'Contact', PHONE_W / 2, ay + 17);
  } else {
    // Back arrow
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(SCREEN_X + 20, headerY + headerH / 2);
    ctx.lineTo(SCREEN_X + 12, headerY + headerH / 2);
    ctx.moveTo(SCREEN_X + 16, headerY + headerH / 2 - 5);
    ctx.lineTo(SCREEN_X + 10, headerY + headerH / 2);
    ctx.lineTo(SCREEN_X + 16, headerY + headerH / 2 + 5);
    ctx.stroke();

    // Avatar
    const ax = SCREEN_X + 44;
    const ay = headerY + headerH / 2;
    ctx.fillStyle = style.id === 'whatsapp' ? '#128c7e' : '#5b9bd5';
    ctx.beginPath();
    ctx.arc(ax, ay, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = `700 13px ${style.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(contactName.charAt(0).toUpperCase(), ax, ay + 1);

    // Name
    ctx.fillStyle = '#fff';
    ctx.font = `600 15px ${style.fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(contactName || 'Contact', ax + 24, ay - 6);

    // Online status
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `400 11px ${style.fontFamily}`;
    ctx.fillText('online', ax + 24, ay + 10);
  }

  // Separator line
  ctx.fillStyle = style.id === 'imessage' ? '#d1d1d6' : 'rgba(255,255,255,0.15)';
  ctx.fillRect(SCREEN_X, headerY + headerH - 0.5, SCREEN_W, 0.5);
}

function drawInputBar(ctx: CanvasRenderingContext2D, style: PlatformStyle) {
  const barY = SCREEN_Y + SCREEN_H - INPUT_BAR_H;

  // Separator
  ctx.fillStyle = style.id === 'imessage' ? '#d1d1d6' : '#ddd';
  ctx.fillRect(SCREEN_X, barY, SCREEN_W, 0.5);

  // Background
  ctx.fillStyle = style.inputBarBg;
  ctx.save();
  ctx.beginPath();
  const bx = SCREEN_X;
  const bw = SCREEN_W;
  ctx.moveTo(bx, barY + 0.5);
  ctx.lineTo(bx + bw, barY + 0.5);
  ctx.lineTo(bx + bw, SCREEN_Y + SCREEN_H - 38);
  ctx.arcTo(bx + bw, SCREEN_Y + SCREEN_H, bx + bw - 38, SCREEN_Y + SCREEN_H, 38);
  ctx.lineTo(bx + 38, SCREEN_Y + SCREEN_H);
  ctx.arcTo(bx, SCREEN_Y + SCREEN_H, bx, SCREEN_Y + SCREEN_H - 38, 38);
  ctx.lineTo(bx, barY + 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Text field
  const fieldX = SCREEN_X + 16;
  const fieldY = barY + 10;
  const fieldW = SCREEN_W - 68;
  const fieldH = 36;
  ctx.strokeStyle = style.id === 'imessage' ? '#c7c7cc' : '#ddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  const fr = 18;
  ctx.moveTo(fieldX + fr, fieldY);
  ctx.lineTo(fieldX + fieldW - fr, fieldY);
  ctx.arcTo(fieldX + fieldW, fieldY, fieldX + fieldW, fieldY + fr, fr);
  ctx.lineTo(fieldX + fieldW, fieldY + fieldH - fr);
  ctx.arcTo(fieldX + fieldW, fieldY + fieldH, fieldX + fieldW - fr, fieldY + fieldH, fr);
  ctx.lineTo(fieldX + fr, fieldY + fieldH);
  ctx.arcTo(fieldX, fieldY + fieldH, fieldX, fieldY + fieldH - fr, fr);
  ctx.lineTo(fieldX, fieldY + fr);
  ctx.arcTo(fieldX, fieldY, fieldX + fr, fieldY, fr);
  ctx.closePath();
  ctx.stroke();

  // Placeholder
  ctx.fillStyle = '#999';
  ctx.font = `400 14px ${style.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    style.id === 'imessage' ? 'iMessage' : 'Message',
    fieldX + 14,
    fieldY + fieldH / 2,
  );

  // Send button
  const sbx = SCREEN_X + SCREEN_W - 44;
  const sby = barY + 10;
  ctx.fillStyle = style.accentColor;
  ctx.beginPath();
  ctx.arc(sbx + 18, sby + 18, 16, 0, Math.PI * 2);
  ctx.fill();

  // Arrow
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.moveTo(sbx + 12, sby + 18);
  ctx.lineTo(sbx + 24, sby + 18);
  ctx.lineTo(sbx + 18, sby + 12);
  ctx.closePath();
  ctx.fill();
}

interface BubbleLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  lines: string[];
  msg: Message;
}

function layoutBubbles(
  ctx: CanvasRenderingContext2D,
  messages: Message[],
  style: PlatformStyle,
): BubbleLayout[] {
  const layouts: BubbleLayout[] = [];
  const maxBubbleW = MSG_AREA_W * 0.72;
  const padX = 12;
  const padY = 8;
  const lineHeight = 20;
  const fontSize = 14;
  let curY = MSG_AREA_TOP + 16;

  ctx.font = `400 ${fontSize}px ${style.fontFamily}`;

  for (const msg of messages) {
    const lines = wrapText(ctx, msg.text, maxBubbleW - padX * 2);
    const textH = lines.length * lineHeight;
    const bubbleW = Math.min(
      maxBubbleW,
      Math.max(...lines.map((l) => ctx.measureText(l).width)) + padX * 2 + (style.checkmarks ? 30 : 0),
    );
    const bubbleH = textH + padY * 2;
    const isSent = msg.direction === 'sent';
    const bubbleX = isSent
      ? MSG_AREA_X + MSG_AREA_W - bubbleW
      : MSG_AREA_X;

    layouts.push({
      x: bubbleX,
      y: curY,
      w: bubbleW,
      h: bubbleH,
      lines,
      msg,
    });

    curY += bubbleH + 8;
  }

  return layouts;
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  layout: BubbleLayout,
  style: PlatformStyle,
) {
  const { x, y, w, h, lines, msg } = layout;
  const isSent = msg.direction === 'sent';
  const padX = 12;
  const padY = 8;
  const lineHeight = 20;
  const fontSize = 14;

  // Bubble background
  ctx.fillStyle = isSent ? style.sentColor : style.receivedColor;
  const r = BUBBLE_RADIUS;
  const trr = isSent ? 4 : r;
  const tlr = isSent ? r : 4;

  ctx.beginPath();
  ctx.moveTo(x + tlr, y);
  ctx.lineTo(x + w - trr, y);
  ctx.arcTo(x + w, y, x + w, y + trr, trr);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + tlr);
  ctx.arcTo(x, y, x + tlr, y, tlr);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.fillStyle = isSent ? style.sentTextColor : style.receivedTextColor;
  ctx.font = `400 ${fontSize}px ${style.fontFamily}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x + padX, y + padY + i * lineHeight);
  }

  // Timestamp
  const timeStr = '9:41';
  ctx.fillStyle = isSent
    ? (style.sentTextColor === '#fff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.4)')
    : 'rgba(0,0,0,0.4)';
  ctx.font = `400 10px ${style.fontFamily}`;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';

  const timeX = x + w - padX;
  const timeY = y + h - 4;
  ctx.fillText(timeStr, timeX - (style.checkmarks ? 18 : 0), timeY);

  // Checkmarks (WhatsApp/Telegram sent)
  if (style.checkmarks && isSent) {
    const cx = timeX - 4;
    const cy = timeY - 6;
    ctx.strokeStyle = style.id === 'whatsapp' ? '#53bdeb' : '#4fae4e';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // First check
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx - 5, cy + 3);
    ctx.lineTo(cx - 1, cy - 2);
    ctx.stroke();
    // Second check
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy);
    ctx.lineTo(cx - 1, cy + 3);
    ctx.lineTo(cx + 3, cy - 2);
    ctx.stroke();
  }
}

function drawTypingIndicator(
  ctx: CanvasRenderingContext2D,
  y: number,
  style: PlatformStyle,
  frame: number,
) {
  const x = MSG_AREA_X;
  const w = 70;
  const h = 36;

  // Bubble
  ctx.fillStyle = style.receivedColor;
  roundRect(ctx, x, y, w, h, BUBBLE_RADIUS);

  // Three dots with animation
  const dotR = 4;
  const dotY = y + h / 2;
  const dotSpacing = 14;
  const startX = x + w / 2 - dotSpacing;

  for (let i = 0; i < 3; i++) {
    const phase = (frame * 4 + i * 8) % 24;
    const bounce = phase < 12 ? Math.sin((phase / 12) * Math.PI) * 3 : 0;
    ctx.fillStyle = style.receivedTextColor === '#000'
      ? `rgba(0,0,0,${0.3 + (phase < 12 ? 0.3 : 0)})`
      : `rgba(255,255,255,${0.3 + (phase < 12 ? 0.3 : 0)})`;
    ctx.beginPath();
    ctx.arc(startX + i * dotSpacing, dotY - bounce, dotR, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ─── component ─── */

export function FakeTextsGenerator() {
  const C = useThemeStore((s) => s.theme);

  const [platform, setPlatform] = useState<PlatformStyleId>('imessage');
  const [contactName, setContactName] = useState('Alex');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hey, are you coming tonight?', sender: 'Me', direction: 'sent' },
    { id: '2', text: 'Yeah, what time?', sender: 'Alex', direction: 'received' },
    { id: '3', text: 'Around 8pm, is that ok?', sender: 'Me', direction: 'sent' },
    { id: '4', text: 'Perfect, see you there!', sender: 'Alex', direction: 'received' },
  ]);
  const [typingDelay, setTypingDelay] = useState(1200);
  const [showTypingIndicator, setShowTypingIndicator] = useState(true);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Cleanup video URL on unmount
  useEffect(() => {
    return () => {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
    };
  }, [videoUrl]);

  // Live preview drawing
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = PLATFORM_STYLES[platform];
    let frame = 0;
    let running = true;

    function draw() {
      if (!running || !ctx) return;
      ctx.clearRect(0, 0, PHONE_W, PHONE_H);

      drawPhoneFrame(ctx, style);
      drawStatusBar(ctx, style);
      drawHeader(ctx, style, contactName);
      drawInputBar(ctx, style);

      // Clip to message area
      ctx.save();
      ctx.beginPath();
      ctx.rect(SCREEN_X, MSG_AREA_TOP, SCREEN_W, MSG_AREA_BOTTOM - MSG_AREA_TOP);
      ctx.clip();

      const visibleMessages = messages.filter((m) => m.text.trim());
      if (visibleMessages.length > 0) {
        const layouts = layoutBubbles(ctx, visibleMessages, style);

        // Calculate scroll to fit messages
        const lastLayout = layouts[layouts.length - 1];
        const totalH = lastLayout ? lastLayout.y + lastLayout.h - MSG_AREA_TOP - 16 : 0;
        const viewH = MSG_AREA_BOTTOM - MSG_AREA_TOP;
        const scrollOffset = totalH > viewH ? totalH - viewH + 24 : 0;

        ctx.save();
        ctx.translate(0, -scrollOffset);
        for (const layout of layouts) {
          drawBubble(ctx, layout, style);
        }

        // Typing indicator
        if (showTypingIndicator) {
          const lastY = lastLayout ? lastLayout.y + lastLayout.h + 8 : MSG_AREA_TOP + 16;
          drawTypingIndicator(ctx, lastY, style, frame);
        }

        ctx.restore();
      } else if (showTypingIndicator) {
        drawTypingIndicator(ctx, MSG_AREA_TOP + 16, style, frame);
      }

      ctx.restore();

      frame++;
      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [platform, contactName, messages, showTypingIndicator]);

  /* ─── message editor callbacks ─── */

  const addMessage = useCallback(() => {
    const lastDir = messages.length > 0 ? messages[messages.length - 1].direction : 'sent';
    const newDir = lastDir === 'sent' ? 'received' : 'sent';
    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        text: '',
        sender: newDir === 'sent' ? 'Me' : contactName || 'Contact',
        direction: newDir,
      },
    ]);
  }, [messages, contactName]);

  const updateMessageText = useCallback((id: string, text: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, text } : m)));
  }, []);

  const toggleDirection = useCallback((id: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, direction: m.direction === 'sent' ? 'received' : 'sent' }
          : m,
      ),
    );
  }, []);

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const moveMessage = useCallback((id: string, dir: -1 | 1) => {
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === id);
      if (idx < 0) return prev;
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }, []);

  /* ─── video generation ─── */

  const handleGenerate = useCallback(async () => {
    if (loading) return;
    const validMessages = messages.filter((m) => m.text.trim());
    if (validMessages.length < 2) return;

    setLoading(true);
    setProgress(0);
    setError('');
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl(null);
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = PHONE_W;
      canvas.height = PHONE_H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      const style = PLATFORM_STYLES[platform];
      const fps = 30;
      const stream = canvas.captureStream(fps);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 2_500_000,
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };
      });

      recorder.start();

      // Helper: draw a full frame with N visible messages + optional typing
      function drawFrame(
        shownMessages: Message[],
        showTyping: boolean,
        frameIdx: number,
        scrollPx: number,
      ) {
        ctx!.clearRect(0, 0, PHONE_W, PHONE_H);
        drawPhoneFrame(ctx!, style);
        drawStatusBar(ctx!, style);
        drawHeader(ctx!, style, contactName);
        drawInputBar(ctx!, style);

        ctx!.save();
        ctx!.beginPath();
        ctx!.rect(SCREEN_X, MSG_AREA_TOP, SCREEN_W, MSG_AREA_BOTTOM - MSG_AREA_TOP);
        ctx!.clip();

        const layouts = shownMessages.length > 0
          ? layoutBubbles(ctx!, shownMessages, style)
          : [];

        const lastLayout = layouts[layouts.length - 1];
        const viewH = MSG_AREA_BOTTOM - MSG_AREA_TOP;

        // Calculate the total content height
        let contentBottom = MSG_AREA_TOP + 16;
        if (lastLayout) {
          contentBottom = lastLayout.y + lastLayout.h + 8;
          if (showTyping) contentBottom += 44;
        } else if (showTyping) {
          contentBottom = MSG_AREA_TOP + 16 + 44;
        }
        const totalContentH = contentBottom - MSG_AREA_TOP;
        const maxScroll = Math.max(0, totalContentH - viewH + 16);
        const actualScroll = Math.min(scrollPx, maxScroll);

        ctx!.save();
        ctx!.translate(0, -actualScroll);

        for (const layout of layouts) {
          drawBubble(ctx!, layout, style);
        }

        if (showTyping) {
          const typY = lastLayout
            ? lastLayout.y + lastLayout.h + 8
            : MSG_AREA_TOP + 16;
          drawTypingIndicator(ctx!, typY, style, frameIdx);
        }

        ctx!.restore();
        ctx!.restore();
      }

      // Animation timeline:
      // 1. Initial pause (0.5s) showing empty chat
      // 2. For each message: optional typing (typingDelay ms), then show message (0.3s pause)
      // 3. Final hold (1s)

      const initialPauseFrames = Math.round(0.5 * fps);
      const typingFrames = showTypingIndicator ? Math.round((typingDelay / 1000) * fps) : 0;
      const messageAppearFrames = Math.round(0.3 * fps);
      const finalHoldFrames = Math.round(1.5 * fps);

      const totalFrames =
        initialPauseFrames +
        validMessages.length * (typingFrames + messageAppearFrames) +
        finalHoldFrames;

      let currentFrame = 0;

      // We need to compute scrolling. First do a dry run to know layout heights.
      function getScrollForMessages(msgs: Message[], includeTyping: boolean): number {
        const tmpLayouts = msgs.length > 0 ? layoutBubbles(ctx!, msgs, style) : [];
        const lastL = tmpLayouts[tmpLayouts.length - 1];
        let contentBottom2 = MSG_AREA_TOP + 16;
        if (lastL) {
          contentBottom2 = lastL.y + lastL.h + 8;
          if (includeTyping) contentBottom2 += 44;
        } else if (includeTyping) {
          contentBottom2 = MSG_AREA_TOP + 16 + 44;
        }
        const viewH2 = MSG_AREA_BOTTOM - MSG_AREA_TOP;
        return Math.max(0, contentBottom2 - MSG_AREA_TOP - viewH2 + 16);
      }

      // Render frames using requestAnimationFrame for smooth recording
      async function renderFrames() {
        // Initial pause
        for (let f = 0; f < initialPauseFrames; f++) {
          drawFrame([], false, currentFrame, 0);
          currentFrame++;
          await waitFrame();
        }

        // Each message
        for (let mi = 0; mi < validMessages.length; mi++) {
          const shownSoFar = validMessages.slice(0, mi);

          // Typing indicator phase
          if (typingFrames > 0) {
            for (let f = 0; f < typingFrames; f++) {
              const scroll = getScrollForMessages(shownSoFar, true);
              drawFrame(shownSoFar, true, currentFrame, scroll);
              currentFrame++;
              if (f % 3 === 0) await waitFrame();
            }
          }

          // Message appears
          const shownWithNew = validMessages.slice(0, mi + 1);
          const scroll = getScrollForMessages(shownWithNew, false);
          for (let f = 0; f < messageAppearFrames; f++) {
            drawFrame(shownWithNew, false, currentFrame, scroll);
            currentFrame++;
            if (f % 3 === 0) await waitFrame();
          }

          setProgress(Math.round(((mi + 1) / validMessages.length) * 90));
        }

        // Final hold
        const finalScroll = getScrollForMessages(validMessages, false);
        for (let f = 0; f < finalHoldFrames; f++) {
          drawFrame(validMessages, false, currentFrame, finalScroll);
          currentFrame++;
          if (f % 3 === 0) await waitFrame();
        }

        setProgress(95);
      }

      function waitFrame(): Promise<void> {
        return new Promise((resolve) => requestAnimationFrame(() => resolve()));
      }

      await renderFrames();

      recorder.stop();
      const blob = await recordingDone;
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);
      setProgress(100);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Video generation failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, platform, contactName, typingDelay, showTypingIndicator, videoUrl]);

  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `fake-text-${platform}-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [videoUrl, platform]);

  const activeStyle = PLATFORM_STYLES[platform];

  return (
    <ToolPageShell
      title="Fake Texts Generator"
      subtitle="Create realistic fake text conversation videos for social media"
      gradient={GRADIENT}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))',
        gap: 24,
      }}>
        {/* ─── Left column: controls ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Platform selector */}
          <div>
            <label style={{
              fontSize: 13, fontWeight: 600, color: C.text,
              marginBottom: 8, display: 'block',
            }}>
              Platform Style
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
              {PLATFORM_IDS.map((pid) => {
                const ps = PLATFORM_STYLES[pid];
                const active = platform === pid;
                const color = PLATFORM_COLORS[pid];
                return (
                  <button
                    key={pid}
                    onClick={() => setPlatform(pid)}
                    style={{
                      padding: '14px 10px', minHeight: 44,
                      borderRadius: 12,
                      border: active ? `2px solid ${color}` : `1px solid ${C.border}`,
                      background: active ? `${color}12` : C.card,
                      color: active ? color : C.text,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontFamily: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = C.cardHover;
                    }}
                    onMouseLeave={(e) => {
                      if (!active) e.currentTarget.style.background = C.card;
                    }}
                  >
                    {/* Mini preview */}
                    <div style={{
                      width: 48, height: 72, borderRadius: 8,
                      background: '#1a1a1a',
                      position: 'relative',
                      overflow: 'hidden',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <div style={{
                        height: 12,
                        background: ps.headerColor,
                      }} />
                      <div style={{
                        padding: '3px 4px',
                        background: ps.bgColor,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}>
                        <div style={{
                          width: 22, height: 6, borderRadius: 3,
                          background: ps.sentColor,
                          alignSelf: 'flex-end',
                          border: ps.sentColor === '#fff' || ps.sentColor === '#dcf8c6' || ps.sentColor === '#effdde'
                            ? '0.5px solid rgba(0,0,0,0.1)' : 'none',
                        }} />
                        <div style={{
                          width: 18, height: 6, borderRadius: 3,
                          background: ps.receivedColor,
                          alignSelf: 'flex-start',
                          border: '0.5px solid rgba(0,0,0,0.08)',
                        }} />
                        <div style={{
                          width: 24, height: 6, borderRadius: 3,
                          background: ps.sentColor,
                          alignSelf: 'flex-end',
                          border: ps.sentColor === '#fff' || ps.sentColor === '#dcf8c6' || ps.sentColor === '#effdde'
                            ? '0.5px solid rgba(0,0,0,0.1)' : 'none',
                        }} />
                      </div>
                    </div>
                    {ps.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contact name */}
          <div>
            <label style={{
              fontSize: 13, fontWeight: 600, color: C.text,
              marginBottom: 8, display: 'block',
            }}>
              Contact Name
            </label>
            <input
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Enter contact name..."
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1px solid ${C.border}`, background: C.card,
                color: C.text, fontSize: 13, boxSizing: 'border-box',
                outline: 'none', fontFamily: 'inherit',
                transition: 'border-color 0.2s ease',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
            />
          </div>

          {/* Message editor */}
          <div>
            <label style={{
              fontSize: 13, fontWeight: 600, color: C.text,
              marginBottom: 8, display: 'block',
            }}>
              Messages
            </label>
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 8,
              padding: 14, borderRadius: 12,
              background: C.surface, border: `1px solid ${C.border}`,
              maxHeight: 400, overflowY: 'auto',
            }}>
              {messages.length === 0 && (
                <p style={{
                  fontSize: 13, color: C.dim,
                  textAlign: 'center', margin: '12px 0',
                }}>
                  No messages yet. Add one below.
                </p>
              )}
              {messages.map((msg, idx) => (
                <div key={msg.id} style={{
                  display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                }}>
                  {/* Index */}
                  <span style={{
                    width: 22, height: 22, borderRadius: 6,
                    background: C.card, border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: C.dim, fontWeight: 600, flexShrink: 0,
                  }}>
                    {idx + 1}
                  </span>

                  {/* Direction toggle */}
                  <button
                    onClick={() => toggleDirection(msg.id)}
                    title={msg.direction === 'sent' ? 'Sent (click to toggle)' : 'Received (click to toggle)'}
                    style={{
                      padding: '5px 8px', borderRadius: 6,
                      background: msg.direction === 'sent'
                        ? activeStyle.sentColor
                        : activeStyle.receivedColor,
                      color: msg.direction === 'sent'
                        ? activeStyle.sentTextColor
                        : activeStyle.receivedTextColor,
                      fontSize: 10, fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', minWidth: 20, transition: 'all 0.15s ease',
                      flexShrink: 0,
                      display: 'flex', alignItems: 'center', gap: 3,
                      border: (activeStyle.receivedColor === '#fff' || activeStyle.receivedColor === '#e5e5ea')
                        && msg.direction === 'received'
                        ? `1px solid ${C.border}` : 'none',
                    }}
                  >
                    {msg.direction === 'sent' ? (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M5 12h14" />
                        <path d="M12 5l7 7-7 7" />
                      </svg>
                    ) : (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                        strokeLinejoin="round">
                        <path d="M19 12H5" />
                        <path d="M12 19l-7-7 7-7" />
                      </svg>
                    )}
                  </button>

                  {/* Text input */}
                  <input
                    value={msg.text}
                    onChange={(e) => updateMessageText(msg.id, e.target.value)}
                    placeholder="Type message..."
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: 8,
                      border: `1px solid ${C.border}`, background: C.card,
                      color: C.text, fontSize: 13, outline: 'none',
                      fontFamily: 'inherit', transition: 'border-color 0.2s ease',
                      minWidth: 0,
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                  />

                  {/* Move up */}
                  <button
                    onClick={() => moveMessage(msg.id, -1)}
                    disabled={idx === 0}
                    title="Move up"
                    style={{
                      width: 28, height: 28, borderRadius: 4, border: 'none',
                      background: C.card, color: idx === 0 ? C.border : C.dim,
                      cursor: idx === 0 ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, flexShrink: 0, padding: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M18 15l-6-6-6 6" />
                    </svg>
                  </button>

                  {/* Move down */}
                  <button
                    onClick={() => moveMessage(msg.id, 1)}
                    disabled={idx === messages.length - 1}
                    title="Move down"
                    style={{
                      width: 28, height: 28, borderRadius: 4, border: 'none',
                      background: C.card,
                      color: idx === messages.length - 1 ? C.border : C.dim,
                      cursor: idx === messages.length - 1 ? 'default' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, flexShrink: 0, padding: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                      stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {/* Remove */}
                  <button
                    onClick={() => removeMessage(msg.id)}
                    title="Remove message"
                    style={{
                      width: 28, height: 28, borderRadius: 4, border: 'none',
                      background: C.card, color: C.dim, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, flexShrink: 0, transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#ef4444';
                      e.currentTarget.style.background = C.cardHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = C.dim;
                      e.currentTarget.style.background = C.card;
                    }}
                  >
                    &times;
                  </button>
                </div>
              ))}

              {/* Add message button */}
              <button
                onClick={addMessage}
                style={{
                  padding: '10px 0', borderRadius: 8,
                  border: `1px dashed ${GRADIENT[0]}55`,
                  background: `${GRADIENT[0]}06`, color: GRADIENT[0],
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${GRADIENT[0]}12`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${GRADIENT[0]}06`;
                }}
              >
                + Add Message
              </button>
            </div>
          </div>

          {/* Typing indicator toggle */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', borderRadius: 10,
            background: C.card, border: `1px solid ${C.border}`,
          }}>
            <div>
              <span style={{
                fontSize: 13, fontWeight: 600, color: C.text, display: 'block',
              }}>
                Typing Indicator
              </span>
              <span style={{ fontSize: 11, color: C.dim }}>
                Show typing bubbles before each message
              </span>
            </div>
            <button
              onClick={() => setShowTypingIndicator(!showTypingIndicator)}
              role="switch"
              aria-checked={showTypingIndicator}
              aria-label="Typing indicator"
              style={{
                width: 44, height: 24, borderRadius: 12, border: 'none',
                background: showTypingIndicator
                  ? `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`
                  : C.border,
                cursor: 'pointer', position: 'relative',
                transition: 'all 0.2s ease', flexShrink: 0,
              }}
            >
              <span style={{
                position: 'absolute',
                top: 3, left: showTypingIndicator ? 23 : 3,
                width: 18, height: 18, borderRadius: '50%',
                background: '#fff', transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>

          {/* Typing delay slider */}
          <div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 8,
            }}>
              <label style={{
                fontSize: 13, fontWeight: 600, color: C.text,
              }}>
                Typing Delay
              </label>
              <span style={{
                fontSize: 12, fontWeight: 600, color: GRADIENT[0],
                padding: '2px 8px', borderRadius: 6,
                background: `${GRADIENT[0]}14`,
              }}>
                {(typingDelay / 1000).toFixed(1)}s
              </span>
            </div>
            <input
              type="range"
              min={300}
              max={3000}
              step={100}
              value={typingDelay}
              onChange={(e) => setTypingDelay(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: GRADIENT[0],
                height: 6,
                cursor: 'pointer',
              }}
            />
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 10, color: C.dim, marginTop: 4,
            }}>
              <span>Fast (0.3s)</span>
              <span>Slow (3.0s)</span>
            </div>
          </div>

          {/* Video format info */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: C.surface, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
              Output Format
            </span>
            <span style={{
              padding: '4px 12px', borderRadius: 8,
              background: `${GRADIENT[0]}18`, color: GRADIENT[0],
              fontSize: 12, fontWeight: 700,
            }}>
              WebM (9:16)
            </span>
          </div>

          {/* Error display */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.19)',
              color: '#ef4444', fontSize: 13, fontWeight: 500,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Generate button */}
          <ActionButton
            label={
              loading
                ? `Generating... ${progress}%`
                : 'Generate Video'
            }
            gradient={GRADIENT}
            onClick={handleGenerate}
            disabled={messages.filter((m) => m.text.trim()).length < 2}
            loading={loading}
          />

          {/* Progress bar */}
          {loading && (
            <div style={{
              width: '100%', height: 6, borderRadius: 3,
              background: C.border, overflow: 'hidden',
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                borderRadius: 3,
                background: `linear-gradient(90deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                transition: 'width 0.3s ease',
              }} />
            </div>
          )}
        </div>

        {/* ─── Right column: preview + download ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
            Live Preview
          </h3>

          {/* Canvas preview (scaled to fit) */}
          <div style={{
            width: '100%',
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            border: `1px solid ${C.border}`,
            background: '#000',
          }}>
            <canvas
              ref={previewCanvasRef}
              width={PHONE_W}
              height={PHONE_H}
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            />
          </div>

          {/* Hidden canvas for recording */}
          <canvas
            ref={canvasRef}
            width={PHONE_W}
            height={PHONE_H}
            style={{ display: 'none' }}
          />

          {/* Video result + download */}
          {videoUrl && (
            <div style={{
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: `${GRADIENT[0]}10`,
                border: `1px solid ${GRADIENT[0]}30`,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke={GRADIENT[0]} strokeWidth="2" strokeLinecap="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span style={{
                  fontSize: 13, fontWeight: 600, color: C.text,
                }}>
                  Video generated successfully
                </span>
              </div>

              <video
                src={videoUrl}
                controls
                style={{
                  width: '100%',
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                }}
              />

              <button
                onClick={handleDownload}
                style={{
                  padding: '12px 0', borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.card, color: C.text,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.cardHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.card;
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download .webm
              </button>
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
