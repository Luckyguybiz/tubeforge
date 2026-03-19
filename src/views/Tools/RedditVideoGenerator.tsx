'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

/* ───── Constants ───── */

const GRADIENT: [string, string] = ['#f97316', '#ef4444'];

const BACKGROUND_STYLES = [
  { id: 'gradient-purple', label: 'Purple Haze', colors: ['#7c3aed', '#2563eb', '#059669'] },
  { id: 'gradient-sunset', label: 'Sunset Glow', colors: ['#f97316', '#ef4444', '#ec4899'] },
  { id: 'gradient-ocean', label: 'Ocean Deep', colors: ['#0ea5e9', '#6366f1', '#8b5cf6'] },
  { id: 'gradient-forest', label: 'Forest Night', colors: ['#059669', '#0d9488', '#0ea5e9'] },
] as const;

/* ───── Types ───── */

interface RedditPostData {
  title: string;
  body: string;
  subreddit: string;
  author: string;
  upvotes: number;
  comments: string[];
}

/* ───── Helpers ───── */

function isValidRedditUrl(url: string): boolean {
  return /^https?:\/\/(www\.)?reddit\.com\/r\/\w+\/comments\/\w+/i.test(url.trim());
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): { lines: string[]; totalHeight: number } {
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

  return { lines, totalHeight: lines.length * lineHeight };
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

/** Fetch a Reddit post from the public JSON API */
async function fetchRedditPost(url: string): Promise<RedditPostData> {
  // Normalise URL: strip trailing slash, append .json
  let cleanUrl = url.trim().replace(/\/+$/, '');
  if (!cleanUrl.endsWith('.json')) cleanUrl += '.json';

  const resp = await fetch(cleanUrl, {
    headers: { Accept: 'application/json' },
  });
  if (!resp.ok) throw new Error(`Reddit API returned ${resp.status}`);

  const json = await resp.json();
  const postData = json?.[0]?.data?.children?.[0]?.data;
  if (!postData) throw new Error('Could not parse Reddit response');

  // Grab top-level comments
  const commentNodes = json?.[1]?.data?.children ?? [];
  const comments: string[] = commentNodes
    .filter((c: { kind: string }) => c.kind === 't1')
    .slice(0, 5)
    .map((c: { data: { body: string } }) => (c.data.body ?? '').slice(0, 300));

  return {
    title: postData.title ?? 'Untitled',
    body: (postData.selftext ?? '').slice(0, 1000),
    subreddit: postData.subreddit_name_prefixed ?? 'r/unknown',
    author: postData.author ?? 'anonymous',
    upvotes: postData.ups ?? 0,
    comments,
  };
}

/* ───── Component ───── */

export function RedditVideoGenerator() {
  const C = useThemeStore((s) => s.theme);

  // Input state
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url');
  const [redditUrl, setRedditUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualText, setManualText] = useState('');

  // Options
  const [selectedVoiceIdx, setSelectedVoiceIdx] = useState(0);
  const [bgStyle, setBgStyle] = useState('gradient-purple');
  const [fontSize, setFontSize] = useState(28);

  // Voices from browser
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Generation state
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [error, setError] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const abortRef = useRef(false);

  // Load voices
  useEffect(() => {
    function loadVoices() {
      const voices = window.speechSynthesis?.getVoices() ?? [];
      // Prefer English voices
      const english = voices.filter((v) => v.lang.startsWith('en'));
      setAvailableVoices(english.length > 0 ? english : voices);
    }
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => {
      window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const canGenerate =
    inputMode === 'url' ? isValidRedditUrl(redditUrl) : manualText.trim().length > 0;

  /* ── Main generation pipeline ── */

  const handleGenerate = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    setProgress(0);
    setError('');
    setVideoUrl(null);
    abortRef.current = false;

    try {
      /* Step 1 — Obtain post data */
      setStatusText('Fetching Reddit post...');
      setProgress(5);

      let postData: RedditPostData;

      if (inputMode === 'url') {
        postData = await fetchRedditPost(redditUrl);
      } else {
        postData = {
          title: manualTitle || 'Untitled Post',
          body: manualText,
          subreddit: 'r/stories',
          author: 'you',
          upvotes: 0,
          comments: [],
        };
      }

      if (abortRef.current) return;

      /* Step 2 — Prepare TTS text */
      setStatusText('Preparing narration...');
      setProgress(10);

      const narrationParts: string[] = [postData.title];
      if (postData.body) narrationParts.push(postData.body);
      postData.comments.forEach((c, i) => {
        narrationParts.push(`Comment ${i + 1}. ${c}`);
      });
      const fullNarration = narrationParts.join('. ');

      // Split into words for word-by-word animation
      const allWords = fullNarration.split(/\s+/).filter(Boolean);

      /* Step 3 — Set up canvas */
      setStatusText('Setting up canvas...');
      setProgress(15);

      const WIDTH = 1080;
      const HEIGHT = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      const ctx = canvas.getContext('2d')!;
      canvasRef.current = canvas;

      const bgDef = BACKGROUND_STYLES.find((b) => b.id === bgStyle) ?? BACKGROUND_STYLES[0];

      /* Step 4 — Speak + record simultaneously */
      setStatusText('Generating video with narration...');
      setProgress(20);

      // Create MediaRecorder from canvas stream
      const stream = canvas.captureStream(30);

      // Try to set up audio via AudioContext + SpeechSynthesis
      let audioCtx: AudioContext | null = null;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;
      try {
        audioCtx = new AudioContext();
        audioDestination = audioCtx.createMediaStreamDestination();
        // Add audio track to video stream
        audioDestination.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      } catch {
        // Audio context not available — video will be silent
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

      // Wrap recording in a promise
      const recordingDone = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: 'video/webm' }));
        };
      });

      recorder.start(100); // collect data every 100ms

      /* Step 5 — Animate + TTS */

      // Word timing: we'll animate based on TTS events or estimated timing
      let currentWordIndex = 0;
      let ttsFinished = false;
      const wordTimestamps: number[] = [];
      const startTime = performance.now();

      // Speak with SpeechSynthesis
      const utterance = new SpeechSynthesisUtterance(fullNarration);
      const selectedVoice = availableVoices[selectedVoiceIdx];
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      // Track word boundaries
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

      window.speechSynthesis.cancel(); // Clear queue
      window.speechSynthesis.speak(utterance);

      // Animation loop
      let frame = 0;
      const animationDone = new Promise<void>((resolve) => {
        function draw() {
          if (abortRef.current) {
            resolve();
            return;
          }

          const elapsed = (performance.now() - startTime) / 1000;
          frame++;

          // ─── Draw background gradient (animated) ───
          const shift = (elapsed * 0.3) % 1;
          const grad = ctx.createLinearGradient(
            0,
            0,
            WIDTH * Math.sin(shift * Math.PI * 2) * 0.3 + WIDTH * 0.5,
            HEIGHT,
          );
          const c = bgDef.colors;
          grad.addColorStop(0, c[0]);
          grad.addColorStop(0.5, c[1]);
          grad.addColorStop(1, c[2]);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          // Floating particles for visual interest
          for (let i = 0; i < 12; i++) {
            const px = ((i * 137 + elapsed * 40 * (i % 3 + 1)) % WIDTH);
            const py = ((i * 211 + elapsed * 20 * ((i + 1) % 3 + 1)) % HEIGHT);
            const radius = 3 + (i % 5) * 2;
            ctx.beginPath();
            ctx.arc(px, py, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${0.05 + (i % 3) * 0.03})`;
            ctx.fill();
          }

          // ─── Draw Reddit post card ───
          const cardX = 60;
          const cardY = 300;
          const cardW = WIDTH - 120;
          const cardRadius = 24;

          // Card shadow
          ctx.shadowColor = 'rgba(0,0,0,0.3)';
          ctx.shadowBlur = 30;
          ctx.shadowOffsetY = 10;

          drawRoundedRect(ctx, cardX, cardY, cardW, 0, cardRadius); // measure first
          ctx.fillStyle = 'rgba(255,255,255,0.95)';

          // Measure card content height
          ctx.font = `bold ${fontSize + 4}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          const titleWrap = wrapText(ctx, postData.title, 0, 0, cardW - 80, fontSize + 10);

          ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          const bodyText = postData.body || '(no body text)';
          const bodyWrap = wrapText(ctx, bodyText, 0, 0, cardW - 80, fontSize + 8);

          const headerH = 60;
          const titleH = titleWrap.totalHeight + 20;
          const bodyH = Math.min(bodyWrap.totalHeight, 600) + 20;
          const footerH = 50;
          const cardH = headerH + titleH + bodyH + footerH + 40;

          drawRoundedRect(ctx, cardX, cardY, cardW, cardH, cardRadius);
          ctx.fillStyle = 'rgba(255,255,255,0.95)';
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;

          // Subreddit header
          let cy = cardY + 35;
          ctx.beginPath();
          ctx.arc(cardX + 45, cy, 18, 0, Math.PI * 2);
          ctx.fillStyle = GRADIENT[0];
          ctx.fill();

          ctx.font = `bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = '#333';
          ctx.fillText(postData.subreddit, cardX + 75, cy + 1);

          ctx.font = `16px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = '#999';
          const subWidth = ctx.measureText(postData.subreddit).width;
          ctx.fillText(` \u00B7 u/${postData.author}`, cardX + 75 + subWidth, cy + 1);

          // Title
          cy = cardY + headerH + 25;
          ctx.font = `bold ${fontSize + 4}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = '#1a1a1a';
          titleWrap.lines.forEach((line, i) => {
            ctx.fillText(line, cardX + 40, cy + i * (fontSize + 10));
          });

          cy += titleH;

          // Body text with word-by-word highlight
          ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          const bodyWords = bodyText.split(/\s+/);
          let wordIdx = 0;
          let lineX = cardX + 40;
          let lineY = cy;
          const maxLineW = cardW - 80;
          const bodyLineHeight = fontSize + 8;
          let currentLineStr = '';

          for (let w = 0; w < bodyWords.length; w++) {
            const word = bodyWords[w];
            const testStr = currentLineStr ? `${currentLineStr} ${word}` : word;
            const tw = ctx.measureText(testStr).width;

            if (tw > maxLineW && currentLineStr) {
              // New line — already drawn
              lineY += bodyLineHeight;
              currentLineStr = word;
              lineX = cardX + 40;
              if (lineY - cy > 580) break;
            } else {
              currentLineStr = testStr;
            }

            // Draw the word
            const wordX = ctx.measureText(
              currentLineStr.slice(0, currentLineStr.lastIndexOf(word)),
            ).width + cardX + 40;

            const isHighlighted = wordIdx < currentWordIndex;
            ctx.fillStyle = isHighlighted ? '#1a1a1a' : '#888';
            if (wordIdx === currentWordIndex) {
              // Active word — highlight background
              const ww = ctx.measureText(word).width;
              ctx.fillStyle = `${GRADIENT[0]}22`;
              drawRoundedRect(ctx, wordX - 4, lineY - fontSize + 2, ww + 8, fontSize + 6, 4);
              ctx.fill();
              ctx.fillStyle = GRADIENT[0];
            }
            ctx.fillText(word, wordX, lineY);
            wordIdx++;
          }

          // Footer — upvotes
          const footerY = cardY + cardH - 40;
          ctx.font = `bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = '#ff4500';

          // Upvote arrow
          ctx.beginPath();
          ctx.moveTo(cardX + 40, footerY);
          ctx.lineTo(cardX + 52, footerY - 14);
          ctx.lineTo(cardX + 64, footerY);
          ctx.fillStyle = '#ff4500';
          ctx.fill();

          ctx.fillText(
            postData.upvotes > 0 ? `${(postData.upvotes / 1000).toFixed(1)}k` : '--',
            cardX + 74,
            footerY + 2,
          );

          // ─── Draw comments below card if present ───
          if (postData.comments.length > 0) {
            let commY = cardY + cardH + 40;
            const visibleComments = postData.comments.slice(0, 2);
            for (const comment of visibleComments) {
              if (commY > HEIGHT - 200) break;

              const commCardW = cardW - 40;
              ctx.font = `${fontSize - 4}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
              const cWrap = wrapText(ctx, comment.slice(0, 200), 0, 0, commCardW - 60, fontSize);
              const cH = Math.min(cWrap.totalHeight, 200) + 40;

              ctx.shadowColor = 'rgba(0,0,0,0.15)';
              ctx.shadowBlur = 15;
              ctx.shadowOffsetY = 5;
              drawRoundedRect(ctx, cardX + 20, commY, commCardW, cH, 16);
              ctx.fillStyle = 'rgba(255,255,255,0.88)';
              ctx.fill();
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetY = 0;

              ctx.fillStyle = '#444';
              ctx.font = `${fontSize - 4}px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
              const maxLines = Math.floor(160 / fontSize);
              cWrap.lines.slice(0, maxLines).forEach((line, i) => {
                ctx.fillText(line, cardX + 50, commY + 30 + i * fontSize);
              });

              commY += cH + 16;
            }
          }

          // ─── Progress bar at bottom ───
          const progBarY = HEIGHT - 60;
          const progBarH = 6;
          drawRoundedRect(ctx, 60, progBarY, WIDTH - 120, progBarH, 3);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fill();

          const progW = Math.max(0, Math.min(1, currentWordIndex / Math.max(allWords.length, 1)));
          if (progW > 0) {
            drawRoundedRect(ctx, 60, progBarY, (WIDTH - 120) * progW, progBarH, 3);
            ctx.fillStyle = '#fff';
            ctx.fill();
          }

          // ─── TubeForge watermark ───
          ctx.font = `bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.fillText('Made with TubeForge', WIDTH / 2 - 80, HEIGHT - 90);

          // Update progress for UI
          if (!ttsFinished) {
            const p = 20 + (currentWordIndex / Math.max(allWords.length, 1)) * 70;
            setProgress(Math.min(p, 90));
          }

          // Keep animating until TTS done (or fallback timeout)
          if (!ttsFinished && elapsed < 300 && !abortRef.current) {
            // If TTS boundary events don't fire, advance based on estimated timing
            if (wordTimestamps.length === 0 && elapsed > 1) {
              // Estimate: ~3 words per second
              currentWordIndex = Math.min(
                Math.floor(elapsed * 3),
                allWords.length,
              );
            }
            requestAnimationFrame(draw);
          } else {
            // Final frame with all words visible
            currentWordIndex = allWords.length;
            // Draw one more frame fully highlighted, then stop
            resolve();
          }
        }

        requestAnimationFrame(draw);
      });

      // Wait for both TTS and animation
      await Promise.all([ttsPromise, animationDone]);

      if (abortRef.current) {
        recorder.stop();
        return;
      }

      // Add a small tail (1 second of extra frames)
      setStatusText('Finalizing video...');
      setProgress(92);
      const finalStart = performance.now();
      await new Promise<void>((resolve) => {
        function finalFrames() {
          const elapsed = (performance.now() - startTime) / 1000;
          const fe = (performance.now() - finalStart) / 1000;

          // Redraw final frame
          const shift = (elapsed * 0.3) % 1;
          const grad = ctx.createLinearGradient(
            0, 0,
            WIDTH * Math.sin(shift * Math.PI * 2) * 0.3 + WIDTH * 0.5,
            HEIGHT,
          );
          const c = bgDef.colors;
          grad.addColorStop(0, c[0]);
          grad.addColorStop(0.5, c[1]);
          grad.addColorStop(1, c[2]);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, WIDTH, HEIGHT);

          // "Thanks for watching" fade in
          const alpha = Math.min(1, fe / 0.5);
          ctx.font = `bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.9})`;
          ctx.textAlign = 'center';
          ctx.fillText('Thanks for watching!', WIDTH / 2, HEIGHT / 2);
          ctx.font = `24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`;
          ctx.fillStyle = `rgba(255,255,255,${alpha * 0.5})`;
          ctx.fillText('Made with TubeForge', WIDTH / 2, HEIGHT / 2 + 50);
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
      recorder.stop();
      const videoBlob = await recordingDone;

      if (abortRef.current) return;

      // Clean up audio context
      if (audioCtx) {
        try { await audioCtx.close(); } catch { /* ignore */ }
      }

      const url = URL.createObjectURL(videoBlob);
      setVideoUrl(url);
      setProgress(100);
      setStatusText('Done!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      setStatusText('');
      window.speechSynthesis?.cancel();
    } finally {
      setLoading(false);
    }
  }, [
    loading, inputMode, redditUrl, manualTitle, manualText,
    availableVoices, selectedVoiceIdx, bgStyle, fontSize,
  ]);

  const handleDownload = useCallback(() => {
    if (!videoUrl) return;
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = 'reddit-video.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, [videoUrl]);

  const handleCancel = useCallback(() => {
    abortRef.current = true;
    window.speechSynthesis?.cancel();
    setLoading(false);
    setStatusText('Cancelled');
  }, []);

  /* ───── Render ───── */

  return (
    <ToolPageShell
      title="Reddit Video Generator"
      subtitle="Turn Reddit posts into viral short-form videos with AI narration"
      gradient={GRADIENT}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 24,
      }}>
        {/* ──── Left column: controls ──── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Input mode toggle */}
          <div style={{
            display: 'flex', borderRadius: 12, overflow: 'hidden',
            border: `1px solid ${C.border}`,
          }}>
            {(['url', 'manual'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setInputMode(mode)}
                style={{
                  flex: 1, padding: '12px 0', border: 'none',
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

          {/* URL or Manual input */}
          {inputMode === 'url' ? (
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                Reddit Post URL
              </label>
              <input
                value={redditUrl}
                onChange={(e) => setRedditUrl(e.target.value)}
                placeholder="https://www.reddit.com/r/AskReddit/comments/..."
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 10,
                  border: `1px solid ${C.border}`, background: C.card,
                  color: C.text, fontSize: 14, boxSizing: 'border-box',
                  outline: 'none', fontFamily: 'inherit',
                  transition: 'border-color 0.2s ease',
                }}
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
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                  Post Title
                </label>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="Enter a title for the Reddit post..."
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.card,
                    color: C.text, fontSize: 14, boxSizing: 'border-box',
                    outline: 'none', fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
                  Post Content
                </label>
                <textarea
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Enter the text content of the Reddit post..."
                  rows={6}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.card,
                    color: C.text, fontSize: 14, boxSizing: 'border-box',
                    outline: 'none', fontFamily: 'inherit', resize: 'vertical',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = GRADIENT[0]; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
                />
              </div>
            </div>
          )}

          {/* Voice selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Narration Voice ({availableVoices.length} available)
            </label>
            {availableVoices.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <select
                  value={selectedVoiceIdx}
                  onChange={(e) => setSelectedVoiceIdx(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: 10,
                    border: `1px solid ${C.border}`, background: C.card,
                    color: C.text, fontSize: 14, boxSizing: 'border-box',
                    outline: 'none', fontFamily: 'inherit',
                    cursor: 'pointer',
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
                    u.rate = 0.9;
                    window.speechSynthesis.speak(u);
                  }}
                  style={{
                    padding: '8px 14px', borderRadius: 8,
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
              </div>
            ) : (
              <p style={{ fontSize: 12, color: C.dim, margin: 0 }}>
                No speech voices found in your browser. The video will be generated without audio narration.
              </p>
            )}
          </div>

          {/* Background style selector */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Background Style
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {BACKGROUND_STYLES.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setBgStyle(bg.id)}
                  style={{
                    padding: '16px 14px', borderRadius: 12,
                    border: bgStyle === bg.id ? `2px solid ${bg.colors[0]}` : `1px solid ${C.border}`,
                    background: bgStyle === bg.id ? `${bg.colors[0]}12` : C.card,
                    color: C.text, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.2s ease',
                    fontFamily: 'inherit', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                  onMouseEnter={(e) => { if (bgStyle !== bg.id) e.currentTarget.style.background = C.cardHover; }}
                  onMouseLeave={(e) => { if (bgStyle !== bg.id) e.currentTarget.style.background = bgStyle === bg.id ? `${bg.colors[0]}12` : C.card; }}
                >
                  <span style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(135deg, ${bg.colors[0]}, ${bg.colors[1]}, ${bg.colors[2]})`,
                    flexShrink: 0,
                  }} />
                  {bg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font size slider */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 8, display: 'block' }}>
              Font Size: {fontSize}px
            </label>
            <input
              type="range"
              min={18}
              max={42}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              style={{
                width: '100%',
                accentColor: GRADIENT[0],
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: C.dim }}>
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          {/* Video format badge */}
          <div style={{
            padding: '12px 16px', borderRadius: 10,
            background: C.surface, border: `1px solid ${C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Video Format</span>
            <span style={{
              padding: '4px 12px', borderRadius: 8,
              background: `${GRADIENT[0]}18`, color: GRADIENT[0],
              fontSize: 12, fontWeight: 700,
            }}>
              1080x1920 (9:16 Shorts)
            </span>
          </div>

          {/* Error display */}
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

          {/* Generate / Cancel buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
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
          <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, margin: 0 }}>
            Video Preview
          </h3>

          {/* Progress bar */}
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
              width: '100%', aspectRatio: '9/16', borderRadius: 14,
              border: `1px solid ${C.border}`, background: C.card,
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
