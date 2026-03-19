'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ToolPageShell, UploadArea, ActionButton } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';
import type { Theme } from '@/lib/types';

const GRADIENT: [string, string] = ['#6366f1', '#ec4899'];

/* ─── Types ─── */

interface DetectedClip {
  id: string;
  startTime: number;
  endTime: number;
  energy: number; // 0-1 normalized
  label: string;
  selected: boolean;
}

interface AnalysisResult {
  energyData: number[];
  windowDuration: number; // seconds per window
  duration: number; // total audio duration in seconds
}

type AnalysisState = 'idle' | 'analyzing' | 'done' | 'error';

/* ─── Audio Analysis ─── */

async function analyzeAudio(file: File): Promise<AnalysisResult> {
  const ctx = new AudioContext();
  const arrayBuffer = await file.arrayBuffer();
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

  const channelData = audioBuffer.getChannelData(0);
  const windowSizeSamples = Math.floor(audioBuffer.sampleRate * 0.5); // 0.5 second windows
  const numWindows = Math.floor(channelData.length / windowSizeSamples);
  const energyData: number[] = [];

  for (let i = 0; i < numWindows; i++) {
    let sum = 0;
    const start = i * windowSizeSamples;
    for (let j = 0; j < windowSizeSamples; j++) {
      sum += channelData[start + j] ** 2;
    }
    energyData.push(Math.sqrt(sum / windowSizeSamples));
  }

  // Normalize
  const max = Math.max(...energyData);
  if (max > 0) {
    for (let i = 0; i < energyData.length; i++) {
      energyData[i] /= max;
    }
  }

  void ctx.close();

  return {
    energyData,
    windowDuration: 0.5,
    duration: audioBuffer.duration,
  };
}

/* ─── Clip Detection ─── */

function detectClips(
  energyData: number[],
  windowDuration: number,
  sensitivity: number,
  minDuration: number,
): DetectedClip[] {
  if (energyData.length === 0) return [];

  const mean = energyData.reduce((a, b) => a + b, 0) / energyData.length;
  // Higher sensitivity = lower threshold. sensitivity 0->1 maps threshold from (mean+1-mean) to mean
  const threshold = mean + (1 - sensitivity) * (1 - mean);

  const clips: DetectedClip[] = [];
  let clipStart = -1;

  for (let i = 0; i <= energyData.length; i++) {
    const above = i < energyData.length && energyData[i] >= threshold;
    if (above) {
      if (clipStart === -1) clipStart = i;
    } else {
      if (clipStart !== -1) {
        const startTime = clipStart * windowDuration;
        const endTime = i * windowDuration;
        if (endTime - startTime >= minDuration) {
          const slice = energyData.slice(clipStart, i);
          const maxEnergy = Math.max(...slice);
          clips.push({
            id: crypto.randomUUID(),
            startTime,
            endTime,
            energy: maxEnergy,
            label: `Highlight ${clips.length + 1}`,
            selected: false,
          });
        }
        clipStart = -1;
      }
    }
  }

  // Sort by energy descending
  clips.sort((a, b) => b.energy - a.energy);

  return clips;
}

/* ─── Helpers ─── */

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 10);
  return `${m}:${String(s).padStart(2, '0')}.${ms}`;
}

function formatTimeFull(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/* ─── Waveform Visualization (Canvas) ─── */

function EnergyWaveform({
  energyData,
  windowDuration,
  clips,
  C,
  onSeek,
}: {
  energyData: number[];
  windowDuration: number;
  clips: DetectedClip[];
  C: Theme;
  onSeek: (time: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 120;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = C.surface;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 8);
    ctx.fill();

    if (energyData.length === 0) return;

    const barWidth = Math.max(1, width / energyData.length);
    const barGap = Math.max(0.5, barWidth * 0.1);
    const effectiveBarWidth = barWidth - barGap;

    // Highlight regions for selected clips
    for (const clip of clips) {
      if (!clip.selected) continue;
      const x1 = (clip.startTime / windowDuration / energyData.length) * width;
      const x2 = (clip.endTime / windowDuration / energyData.length) * width;
      ctx.fillStyle = `${GRADIENT[0]}20`;
      ctx.fillRect(x1, 0, x2 - x1, height);
    }

    // Draw bars
    for (let i = 0; i < energyData.length; i++) {
      const energy = energyData[i];
      const barH = Math.max(2, energy * (height - 16));
      const x = i * barWidth + barGap / 2;
      const y = height - 8 - barH;

      // Color: gradient from blue to pink based on energy
      const r = Math.round(99 + energy * (236 - 99));
      const g = Math.round(102 + energy * (72 - 102));
      const b = Math.round(241 + energy * (153 - 241));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.roundRect(x, y, effectiveBarWidth, barH, 1);
      ctx.fill();
    }

    // Draw clip markers
    for (const clip of clips) {
      const x1 = (clip.startTime / windowDuration / energyData.length) * width;
      const x2 = (clip.endTime / windowDuration / energyData.length) * width;

      ctx.strokeStyle = GRADIENT[0];
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x1, 0);
      ctx.lineTo(x1, height);
      ctx.moveTo(x2, 0);
      ctx.lineTo(x2, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [energyData, windowDuration, clips, C]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || energyData.length === 0) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const time = ratio * energyData.length * windowDuration;
      onSeek(time);
    },
    [energyData, windowDuration, onSeek],
  );

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas
        ref={canvasRef}
        onClick={handleClick}
        style={{
          width: '100%',
          height: 120,
          borderRadius: 8,
          cursor: 'crosshair',
          display: 'block',
        }}
      />
    </div>
  );
}

/* ─── Main Component ─── */

export function AutoClip() {
  const C = useThemeStore((s) => s.theme);

  // File + video state
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Analysis state
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Clips
  const [clips, setClips] = useState<DetectedClip[]>([]);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);

  // Parameters
  const [sensitivity, setSensitivity] = useState(0.5);
  const [minClipDuration, setMinClipDuration] = useState(2);

  // Copy feedback
  const [copied, setCopied] = useState(false);

  // Handle file upload
  const handleFile = useCallback((f: File) => {
    // Revoke old URL
    if (videoUrl) URL.revokeObjectURL(videoUrl);

    setFile(f);
    setVideoUrl(URL.createObjectURL(f));
    setAnalysisState('idle');
    setAnalysisResult(null);
    setClips([]);
    setActiveClipId(null);
    setErrorMessage('');
  }, [videoUrl]);

  // Handle remove file
  const handleRemoveFile = useCallback(() => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setFile(null);
    setVideoUrl(null);
    setAnalysisState('idle');
    setAnalysisResult(null);
    setClips([]);
    setActiveClipId(null);
    setErrorMessage('');
  }, [videoUrl]);

  // Analyze video
  const handleAnalyze = useCallback(async () => {
    if (!file || analysisState === 'analyzing') return;

    setAnalysisState('analyzing');
    setAnalysisProgress('Decoding audio track...');
    setClips([]);
    setActiveClipId(null);
    setErrorMessage('');

    try {
      const result = await analyzeAudio(file);

      setAnalysisProgress('Detecting highlights...');
      setAnalysisResult(result);

      const detected = detectClips(
        result.energyData,
        result.windowDuration,
        sensitivity,
        minClipDuration,
      );

      setClips(detected);
      setAnalysisState('done');
      setAnalysisProgress('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error during analysis';
      setErrorMessage(msg);
      setAnalysisState('error');
      setAnalysisProgress('');
    }
  }, [file, analysisState, sensitivity, minClipDuration]);

  // Re-detect clips when parameters change (if we already have analysis data)
  const handleRedetect = useCallback(() => {
    if (!analysisResult) return;
    const detected = detectClips(
      analysisResult.energyData,
      analysisResult.windowDuration,
      sensitivity,
      minClipDuration,
    );
    setClips(detected);
  }, [analysisResult, sensitivity, minClipDuration]);

  // Preview clip in video
  const handlePreviewClip = useCallback((clip: DetectedClip) => {
    setActiveClipId(clip.id);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime;
      void videoRef.current.play();
    }
  }, []);

  // Seek waveform
  const handleWaveformSeek = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  // Toggle clip selection
  const handleToggleClip = useCallback((clipId: string) => {
    setClips((prev) =>
      prev.map((c) => (c.id === clipId ? { ...c, selected: !c.selected } : c)),
    );
  }, []);

  // Select all / deselect all
  const handleSelectAll = useCallback(() => {
    const allSelected = clips.every((c) => c.selected);
    setClips((prev) => prev.map((c) => ({ ...c, selected: !allSelected })));
  }, [clips]);

  // Copy timestamps
  const handleCopyTimestamps = useCallback(() => {
    const selected = clips.filter((c) => c.selected);
    if (selected.length === 0) return;

    const text = selected
      .map(
        (c) =>
          `${c.label}: ${formatTimeFull(c.startTime)} - ${formatTimeFull(c.endTime)} (energy: ${Math.round(c.energy * 100)}%)`,
      )
      .join('\n');

    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [clips]);

  const selectedCount = clips.filter((c) => c.selected).length;

  return (
    <ToolPageShell
      title="AutoClip"
      subtitle="Detect highlights and interesting moments in your videos using audio energy analysis"
      gradient={GRADIENT}
      badge="BETA"
      badgeColor="#6366f1"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        {/* ─── Left Column: Controls ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Upload */}
          {!file ? (
            <UploadArea
              C={C}
              accept="video/*"
              onFile={handleFile}
              label="Drop your video here"
            />
          ) : (
            <div
              style={{
                padding: 16,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                background: C.surface,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: `linear-gradient(135deg, ${GRADIENT[0]}, ${GRADIENT[1]})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: C.text,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {file.name}
                </p>
                <p style={{ fontSize: 12, color: C.dim, margin: '2px 0 0' }}>
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                aria-label="Remove video file"
                style={{
                  background: 'none',
                  border: 'none',
                  color: C.dim,
                  cursor: 'pointer',
                  fontSize: 18,
                  padding: 4,
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = C.dim;
                }}
              >
                &times;
              </button>
            </div>
          )}

          {/* Sensitivity Slider */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.text,
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Sensitivity</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.dim,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {Math.round(sensitivity * 100)}%
              </span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(sensitivity * 100)}
                onChange={(e) => setSensitivity(Number(e.target.value) / 100)}
                style={{
                  width: '100%',
                  height: 6,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  borderRadius: 3,
                  background: `linear-gradient(to right, ${GRADIENT[0]} ${sensitivity * 100}%, ${C.border} ${sensitivity * 100}%)`,
                  outline: 'none',
                  cursor: 'pointer',
                  accentColor: GRADIENT[0],
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: C.dim,
                marginTop: 4,
              }}
            >
              <span>Fewer clips</span>
              <span>More clips</span>
            </div>
          </div>

          {/* Min Clip Duration Slider */}
          <div>
            <label
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.text,
                marginBottom: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>Min Clip Duration</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: C.dim,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {minClipDuration.toFixed(1)}s
              </span>
            </label>
            <input
              type="range"
              min={5}
              max={100}
              value={Math.round(minClipDuration * 10)}
              onChange={(e) => setMinClipDuration(Number(e.target.value) / 10)}
              style={{
                width: '100%',
                height: 6,
                appearance: 'none',
                WebkitAppearance: 'none',
                borderRadius: 3,
                background: `linear-gradient(to right, ${GRADIENT[1]} ${((minClipDuration - 0.5) / 9.5) * 100}%, ${C.border} ${((minClipDuration - 0.5) / 9.5) * 100}%)`,
                outline: 'none',
                cursor: 'pointer',
                accentColor: GRADIENT[1],
              }}
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10,
                color: C.dim,
                marginTop: 4,
              }}
            >
              <span>0.5s</span>
              <span>10s</span>
            </div>
          </div>

          {/* Analyze / Re-detect Buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <ActionButton
                label={analysisState === 'analyzing' ? 'Analyzing...' : 'Analyze Video'}
                gradient={GRADIENT}
                onClick={handleAnalyze}
                disabled={!file}
                loading={analysisState === 'analyzing'}
              />
            </div>
            {analysisResult && (
              <button
                onClick={handleRedetect}
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `1px solid ${GRADIENT[0]}`,
                  background: `${GRADIENT[0]}15`,
                  color: GRADIENT[0],
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${GRADIENT[0]}25`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${GRADIENT[0]}15`;
                }}
              >
                Re-detect
              </button>
            )}
          </div>

          {/* Status messages */}
          {analysisState === 'analyzing' && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: `${GRADIENT[0]}10`,
                border: `1px solid ${GRADIENT[0]}30`,
                fontSize: 13,
                color: GRADIENT[0],
                fontWeight: 500,
              }}
            >
              {analysisProgress}
            </div>
          )}
          {analysisState === 'error' && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: '#ef444415',
                border: '1px solid #ef444440',
                fontSize: 13,
                color: '#ef4444',
                fontWeight: 500,
              }}
            >
              Error: {errorMessage}
            </div>
          )}
          {analysisState === 'done' && (
            <div
              style={{
                padding: 12,
                borderRadius: 10,
                background: '#22c55e12',
                border: '1px solid #22c55e30',
                fontSize: 13,
                color: '#22c55e',
                fontWeight: 500,
              }}
            >
              Found {clips.length} highlight{clips.length !== 1 ? 's' : ''} in{' '}
              {analysisResult
                ? formatTimeFull(analysisResult.duration)
                : '?'}{' '}
              of video
            </div>
          )}
        </div>

        {/* ─── Right Column: Preview + Results ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Video Player */}
          {videoUrl ? (
            <div
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: `1px solid ${C.border}`,
                background: '#000',
              }}
            >
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                style={{
                  width: '100%',
                  maxHeight: 320,
                  display: 'block',
                }}
              />
            </div>
          ) : (
            <div
              style={{
                padding: '48px 24px',
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                background: C.card,
                textAlign: 'center',
              }}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke={C.dim}
                strokeWidth="1.5"
                opacity={0.4}
              >
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
              <p style={{ fontSize: 13, color: C.dim, marginTop: 12 }}>
                Upload a video to get started
              </p>
            </div>
          )}

          {/* Energy Waveform */}
          {analysisResult && analysisResult.energyData.length > 0 && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <h3
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: C.text,
                    margin: 0,
                  }}
                >
                  Audio Energy
                </h3>
                <span style={{ fontSize: 11, color: C.dim }}>
                  Click to seek
                </span>
              </div>
              <EnergyWaveform
                energyData={analysisResult.energyData}
                windowDuration={analysisResult.windowDuration}
                clips={clips}
                C={C}
                onSeek={handleWaveformSeek}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  fontSize: 10,
                  color: C.dim,
                }}
              >
                <span>0:00</span>
                <span>{formatTimeFull(analysisResult.duration)}</span>
              </div>
            </div>
          )}

          {/* Detected Clips List */}
          {analysisState === 'done' && (
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: C.text,
                    margin: 0,
                  }}
                >
                  Detected Highlights
                </h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {clips.length > 0 && (
                    <button
                      onClick={handleSelectAll}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        background: C.card,
                        color: C.sub,
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = C.cardHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = C.card;
                      }}
                    >
                      {clips.every((c) => c.selected)
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                  )}
                  {selectedCount > 0 && (
                    <button
                      onClick={handleCopyTimestamps}
                      style={{
                        padding: '4px 12px',
                        borderRadius: 6,
                        border: `1px solid ${GRADIENT[0]}`,
                        background: copied ? '#22c55e' : `${GRADIENT[0]}18`,
                        color: copied ? '#fff' : GRADIENT[0],
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                      onMouseEnter={(e) => {
                        if (!copied)
                          e.currentTarget.style.background = `${GRADIENT[0]}30`;
                      }}
                      onMouseLeave={(e) => {
                        if (!copied)
                          e.currentTarget.style.background = `${GRADIENT[0]}18`;
                      }}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {copied ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : (
                          <>
                            <rect
                              x="9"
                              y="9"
                              width="13"
                              height="13"
                              rx="2"
                              ry="2"
                            />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </>
                        )}
                      </svg>
                      {copied
                        ? 'Copied!'
                        : `Copy ${selectedCount} Timestamp${selectedCount !== 1 ? 's' : ''}`}
                    </button>
                  )}
                </div>
              </div>

              {clips.length === 0 ? (
                <div
                  style={{
                    padding: '32px 24px',
                    borderRadius: 12,
                    border: `1px solid ${C.border}`,
                    background: C.card,
                    textAlign: 'center',
                  }}
                >
                  <p style={{ fontSize: 13, color: C.dim, margin: 0 }}>
                    No highlights detected. Try increasing the sensitivity or
                    lowering the minimum clip duration.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxHeight: 400,
                    overflowY: 'auto',
                  }}
                >
                  {clips.map((clip) => (
                    <div
                      key={clip.id}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 10,
                        border:
                          activeClipId === clip.id
                            ? `2px solid ${GRADIENT[0]}`
                            : `1px solid ${C.border}`,
                        background:
                          activeClipId === clip.id
                            ? `${GRADIENT[0]}08`
                            : C.card,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (activeClipId !== clip.id)
                          e.currentTarget.style.background = C.cardHover;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          activeClipId === clip.id
                            ? `${GRADIENT[0]}08`
                            : C.card;
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => handleToggleClip(clip.id)}
                        aria-label={
                          clip.selected ? 'Deselect clip' : 'Select clip'
                        }
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 5,
                          border: clip.selected
                            ? `2px solid ${GRADIENT[0]}`
                            : `2px solid ${C.dim}`,
                          background: clip.selected ? GRADIENT[0] : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          padding: 0,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {clip.selected && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>

                      {/* Energy indicator */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: `linear-gradient(135deg, ${GRADIENT[0]}${Math.round(clip.energy * 60 + 20).toString(16).padStart(2, '0')}, ${GRADIENT[1]}${Math.round(clip.energy * 60 + 20).toString(16).padStart(2, '0')})`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          position: 'relative',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color:
                              clip.energy > 0.6 ? '#fff' : C.text,
                          }}
                        >
                          {Math.round(clip.energy * 100)}
                        </span>
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.text,
                            margin: 0,
                          }}
                        >
                          {clip.label}
                        </p>
                        <p
                          style={{
                            fontSize: 11,
                            color: C.dim,
                            margin: '2px 0 0',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {formatTime(clip.startTime)} —{' '}
                          {formatTime(clip.endTime)} (
                          {(clip.endTime - clip.startTime).toFixed(1)}s)
                        </p>
                      </div>

                      {/* Preview button */}
                      <button
                        onClick={() => handlePreviewClip(clip)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 8,
                          border:
                            activeClipId === clip.id
                              ? `1px solid ${GRADIENT[0]}`
                              : `1px solid ${C.border}`,
                          background:
                            activeClipId === clip.id
                              ? `${GRADIENT[0]}18`
                              : C.surface,
                          color:
                            activeClipId === clip.id
                              ? GRADIENT[0]
                              : C.text,
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          flexShrink: 0,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${GRADIENT[0]}20`;
                          e.currentTarget.style.borderColor = GRADIENT[0];
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            activeClipId === clip.id
                              ? `${GRADIENT[0]}18`
                              : C.surface;
                          e.currentTarget.style.borderColor =
                            activeClipId === clip.id
                              ? GRADIENT[0]
                              : C.border;
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          stroke="none"
                        >
                          <polygon points="5 3 19 12 5 21 5 3" />
                        </svg>
                        Preview
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ToolPageShell>
  );
}
