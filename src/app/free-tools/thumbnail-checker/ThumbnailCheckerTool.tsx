"use client";

import { useState, useRef, useCallback } from "react";

interface AnalysisResult {
  brightness: { score: number; label: string; suggestion: string };
  contrast: { score: number; label: string; suggestion: string };
  saturation: { score: number; label: string; suggestion: string };
  composition: { score: number; label: string; suggestion: string };
  faceDetection: { score: number; label: string; suggestion: string };
  resolution: { score: number; label: string; suggestion: string };
  overall: number;
}

function analyzeImage(img: HTMLImageElement): AnalysisResult {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Resize for performance (analyze at 320px width)
  const scale = 320 / img.naturalWidth;
  canvas.width = 320;
  canvas.height = Math.round(img.naturalHeight * scale);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const totalPixels = canvas.width * canvas.height;

  // --- Brightness analysis ---
  let totalBrightness = 0;
  const brightnessValues: number[] = [];

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    totalBrightness += brightness;
    brightnessValues.push(brightness);
  }

  const avgBrightness = totalBrightness / totalPixels;
  // Ideal brightness is 100-170 (not too dark, not washed out)
  let brightnessScore: number;
  if (avgBrightness >= 90 && avgBrightness <= 180) {
    brightnessScore = 90 + Math.round((1 - Math.abs(avgBrightness - 135) / 45) * 10);
  } else if (avgBrightness < 90) {
    brightnessScore = Math.max(30, Math.round((avgBrightness / 90) * 70));
  } else {
    brightnessScore = Math.max(40, Math.round(100 - ((avgBrightness - 180) / 75) * 60));
  }
  brightnessScore = Math.min(100, Math.max(0, brightnessScore));

  const brightnessResult = {
    score: brightnessScore,
    label: avgBrightness < 80 ? "Too dark" : avgBrightness > 190 ? "Too bright" : "Good brightness",
    suggestion:
      avgBrightness < 80
        ? "Your thumbnail is quite dark. Consider increasing brightness or adding lighter elements for better visibility at small sizes."
        : avgBrightness > 190
          ? "Your thumbnail is very bright. This may look washed out. Try adding darker elements or increasing contrast."
          : "Brightness is in a good range for YouTube thumbnails.",
  };

  // --- Contrast analysis ---
  brightnessValues.sort((a, b) => a - b);
  const p10 = brightnessValues[Math.floor(totalPixels * 0.1)];
  const p90 = brightnessValues[Math.floor(totalPixels * 0.9)];
  const contrastRange = p90 - p10;
  // Ideal contrast range is 100+
  let contrastScore = Math.min(100, Math.round((contrastRange / 150) * 100));
  contrastScore = Math.max(0, contrastScore);

  const contrastResult = {
    score: contrastScore,
    label: contrastRange < 60 ? "Low contrast" : contrastRange > 120 ? "Great contrast" : "Moderate contrast",
    suggestion:
      contrastRange < 60
        ? "Low contrast may make text and subjects hard to see at thumbnail size. Add bolder colors or darker/lighter overlays."
        : contrastRange < 100
          ? "Decent contrast but could be stronger. Bold text and vivid colors help thumbnails stand out in search results."
          : "Strong contrast — text and subjects will be easy to distinguish at small sizes.",
  };

  // --- Saturation analysis ---
  let totalSaturation = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    const sat = max === min ? 0 : l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
    totalSaturation += sat;
  }
  const avgSaturation = totalSaturation / totalPixels;
  // Ideal saturation ~0.3-0.6
  let saturationScore: number;
  if (avgSaturation >= 0.25 && avgSaturation <= 0.65) {
    saturationScore = 80 + Math.round((1 - Math.abs(avgSaturation - 0.45) / 0.2) * 20);
  } else if (avgSaturation < 0.25) {
    saturationScore = Math.max(30, Math.round((avgSaturation / 0.25) * 70));
  } else {
    saturationScore = Math.max(50, Math.round(100 - ((avgSaturation - 0.65) / 0.35) * 50));
  }
  saturationScore = Math.min(100, Math.max(0, saturationScore));

  const saturationResult = {
    score: saturationScore,
    label: avgSaturation < 0.15 ? "Desaturated" : avgSaturation > 0.7 ? "Oversaturated" : "Good color",
    suggestion:
      avgSaturation < 0.15
        ? "Very muted colors. YouTube thumbnails with vibrant colors tend to get 20% more clicks. Try boosting saturation."
        : avgSaturation > 0.7
          ? "Colors are very saturated — this may look unnatural. Dial back slightly for a more professional look."
          : "Color saturation is in a good range for grabbing attention in the feed.",
  };

  // --- Composition / Edge density (visual complexity) ---
  // Use Sobel-like edge detection
  let edgeSum = 0;
  const w = canvas.width;
  for (let y = 1; y < canvas.height - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const left = brightnessValues[(y * w + (x - 1))];
      const right = brightnessValues[(y * w + (x + 1))];
      const top = brightnessValues[((y - 1) * w + x)];
      const bottom = brightnessValues[((y + 1) * w + x)];
      // Simplified gradient magnitude
      const gx = right - left;
      const gy = bottom - top;
      edgeSum += Math.sqrt(gx * gx + gy * gy);
    }
  }
  const avgEdge = edgeSum / ((canvas.width - 2) * (canvas.height - 2));
  // Moderate complexity is ideal (15-40 range)
  let compositionScore: number;
  if (avgEdge >= 12 && avgEdge <= 45) {
    compositionScore = 75 + Math.round((1 - Math.abs(avgEdge - 28) / 17) * 25);
  } else if (avgEdge < 12) {
    compositionScore = Math.max(40, Math.round((avgEdge / 12) * 70));
  } else {
    compositionScore = Math.max(40, Math.round(100 - ((avgEdge - 45) / 30) * 50));
  }
  compositionScore = Math.min(100, Math.max(0, compositionScore));

  const compositionResult = {
    score: compositionScore,
    label: avgEdge < 10 ? "Too simple" : avgEdge > 50 ? "Too busy" : "Good complexity",
    suggestion:
      avgEdge < 10
        ? "The image is very simple or uniform. Add text, faces, or visual elements to create a more engaging thumbnail."
        : avgEdge > 50
          ? "The image is quite busy. Simplify by reducing background clutter. Thumbnails should be readable at 100px wide."
          : "Good visual complexity. The thumbnail has enough detail to be engaging without being cluttered.",
  };

  // --- Face detection (skin tone heuristic) ---
  let skinPixels = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Broad skin-tone detection (works across many skin tones)
    if (
      r > 60 && g > 40 && b > 20 &&
      r > g && r > b &&
      (r - g) > 10 && (r - g) < 100 &&
      Math.abs(g - b) < 80
    ) {
      skinPixels++;
    }
  }
  const skinRatio = skinPixels / totalPixels;
  // Having 5-30% skin-tone pixels suggests a face is present
  let faceScore: number;
  if (skinRatio >= 0.05 && skinRatio <= 0.35) {
    faceScore = 80 + Math.round(Math.min(1, skinRatio / 0.15) * 20);
  } else if (skinRatio < 0.05) {
    faceScore = Math.max(40, Math.round((skinRatio / 0.05) * 70));
  } else {
    faceScore = 70; // Very high skin ratio — still OK
  }
  faceScore = Math.min(100, Math.max(0, faceScore));

  const faceResult = {
    score: faceScore,
    label: skinRatio < 0.03 ? "No face detected" : skinRatio > 0.05 ? "Face likely detected" : "Possible face",
    suggestion:
      skinRatio < 0.03
        ? "No face detected. Thumbnails with faces get up to 38% more clicks. Consider adding a person to your thumbnail."
        : "A face appears to be present. Faces with expressive emotions (surprise, excitement) tend to perform best.",
  };

  // --- Resolution check ---
  const w_orig = img.naturalWidth;
  const h_orig = img.naturalHeight;
  const aspectRatio = w_orig / h_orig;
  const idealAspect = 16 / 9;
  const aspectDiff = Math.abs(aspectRatio - idealAspect);

  let resolutionScore = 100;
  if (w_orig < 640) resolutionScore -= 40;
  else if (w_orig < 1280) resolutionScore -= 15;
  if (aspectDiff > 0.3) resolutionScore -= 30;
  else if (aspectDiff > 0.1) resolutionScore -= 10;
  resolutionScore = Math.max(0, resolutionScore);

  const resolutionResult = {
    score: resolutionScore,
    label:
      w_orig >= 1280 && aspectDiff < 0.1
        ? "Perfect resolution"
        : w_orig < 640
          ? "Too small"
          : "Acceptable",
    suggestion:
      w_orig < 640
        ? `Image is ${w_orig}x${h_orig}px. YouTube recommends at least 1280x720px (16:9). Upload a higher resolution image.`
        : w_orig < 1280
          ? `Image is ${w_orig}x${h_orig}px. For best quality, use 1280x720px or higher. Current size may look blurry.`
          : aspectDiff > 0.1
            ? `Aspect ratio (${aspectRatio.toFixed(2)}) differs from YouTube's 16:9 (1.78). Your thumbnail may be cropped.`
            : `Resolution is ${w_orig}x${h_orig}px — meets YouTube's recommendation of 1280x720px.`,
  };

  // --- Overall score ---
  const overall = Math.round(
    brightnessScore * 0.15 +
    contrastScore * 0.25 +
    saturationScore * 0.15 +
    compositionScore * 0.15 +
    faceScore * 0.15 +
    resolutionScore * 0.15,
  );

  return {
    brightness: brightnessResult,
    contrast: contrastResult,
    saturation: saturationResult,
    composition: compositionResult,
    faceDetection: faceResult,
    resolution: resolutionResult,
    overall,
  };
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "#34c759" : score >= 60 ? "#ff9f0a" : "#ff3b30";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: "#e5e5ea",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: "100%",
            background: color,
            borderRadius: 3,
            transition: "width 0.6s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color,
          minWidth: 40,
          textAlign: "right",
        }}
      >
        {score}
      </span>
    </div>
  );
}

export function ThumbnailCheckerTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageUrl(url);
      setAnalysis(null);
      setAnalyzing(true);

      const img = new Image();
      img.onload = () => {
        const result = analyzeImage(img);
        setAnalysis(result);
        setAnalyzing(false);
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const categories = analysis
    ? [
        { key: "resolution", ...analysis.resolution, categoryLabel: "Resolution" },
        { key: "contrast", ...analysis.contrast, categoryLabel: "Contrast" },
        { key: "brightness", ...analysis.brightness, categoryLabel: "Brightness" },
        { key: "saturation", ...analysis.saturation, categoryLabel: "Saturation" },
        { key: "composition", ...analysis.composition, categoryLabel: "Composition" },
        { key: "faceDetection", ...analysis.faceDetection, categoryLabel: "Face Detection" },
      ]
    : [];

  return (
    <div>
      {/* Upload area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          background: "#ffffff",
          borderRadius: 18,
          padding: imageUrl ? "16px" : "48px 28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
          border: "2px dashed #d2d2d7",
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.3s ease",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleInputChange}
          style={{ display: "none" }}
        />
        {imageUrl ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Uploaded thumbnail"
              style={{
                maxWidth: "100%",
                maxHeight: 400,
                borderRadius: 12,
                objectFit: "contain",
              }}
            />
            <p style={{ fontSize: 13, color: "#86868b", marginTop: 12, marginBottom: 0 }}>
              Click or drag to replace the image
            </p>
          </div>
        ) : (
          <div>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#86868b"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginBottom: 16 }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p
              style={{
                fontSize: 17,
                color: "#1d1d1f",
                fontWeight: 500,
                margin: "0 0 8px",
              }}
            >
              Drop your thumbnail here or click to upload
            </p>
            <p style={{ fontSize: 14, color: "#86868b", margin: 0 }}>
              JPG, PNG, or GIF. Recommended: 1280x720px (16:9)
            </p>
          </div>
        )}
      </div>

      {/* Analyzing indicator */}
      {analyzing && (
        <div
          style={{
            marginTop: 24,
            padding: "20px",
            background: "#f5f5f7",
            borderRadius: 12,
            textAlign: "center",
            fontSize: 15,
            color: "#86868b",
          }}
        >
          Analyzing your thumbnail...
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div style={{ marginTop: 24 }}>
          {/* Overall score */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: 18,
              padding: "28px",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
              border: "1px solid #e5e5ea",
              textAlign: "center",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#86868b",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}
            >
              Overall Score
            </div>
            <div
              style={{
                fontSize: 56,
                fontWeight: 600,
                lineHeight: 1,
                color:
                  analysis.overall >= 80
                    ? "#34c759"
                    : analysis.overall >= 60
                      ? "#ff9f0a"
                      : "#ff3b30",
                letterSpacing: "-0.02em",
              }}
            >
              {analysis.overall}
            </div>
            <div style={{ fontSize: 15, color: "#86868b", marginTop: 4 }}>
              {analysis.overall >= 80
                ? "Great thumbnail! Ready for publishing."
                : analysis.overall >= 60
                  ? "Good thumbnail with room for improvement."
                  : "Needs work. See suggestions below."}
            </div>
          </div>

          {/* Category breakdowns */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {categories.map((cat) => (
              <div
                key={cat.key}
                style={{
                  background: "#ffffff",
                  borderRadius: 14,
                  padding: "20px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                  border: "1px solid #e5e5ea",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#1d1d1f" }}>
                    {cat.categoryLabel}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: cat.score >= 80 ? "#34c759" : cat.score >= 60 ? "#ff9f0a" : "#ff3b30",
                      background:
                        cat.score >= 80
                          ? "rgba(52,199,89,0.1)"
                          : cat.score >= 60
                            ? "rgba(255,159,10,0.1)"
                            : "rgba(255,59,48,0.1)",
                      padding: "3px 10px",
                      borderRadius: 980,
                    }}
                  >
                    {cat.label}
                  </span>
                </div>
                <ScoreBar score={cat.score} label={cat.categoryLabel} />
                <p
                  style={{
                    fontSize: 14,
                    color: "#86868b",
                    lineHeight: 1.5,
                    margin: "10px 0 0",
                  }}
                >
                  {cat.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
