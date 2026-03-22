"use client";

import { useState, useRef, useCallback } from "react";

interface ImageInfo {
  width: number;
  height: number;
  fileSize: number;
  aspectRatio: number;
  url: string;
}

interface Check {
  label: string;
  status: "pass" | "warn" | "fail";
  detail: string;
}

function analyzeImage(info: ImageInfo): Check[] {
  const checks: Check[] = [];

  // Resolution check
  if (info.width >= 1280 && info.height >= 720) {
    checks.push({
      label: "Resolution",
      status: "pass",
      detail: `${info.width}x${info.height}px meets the recommended 1280x720px.`,
    });
  } else if (info.width >= 640) {
    checks.push({
      label: "Resolution",
      status: "warn",
      detail: `${info.width}x${info.height}px is acceptable but below the recommended 1280x720px. May look slightly blurry.`,
    });
  } else {
    checks.push({
      label: "Resolution",
      status: "fail",
      detail: `${info.width}x${info.height}px is below the minimum 640px width. Thumbnail will appear blurry.`,
    });
  }

  // Aspect ratio check
  const idealAspect = 16 / 9;
  const diff = Math.abs(info.aspectRatio - idealAspect);
  if (diff < 0.05) {
    checks.push({
      label: "Aspect ratio",
      status: "pass",
      detail: `${info.aspectRatio.toFixed(2)} is within the ideal 16:9 (1.78) range.`,
    });
  } else if (diff < 0.2) {
    checks.push({
      label: "Aspect ratio",
      status: "warn",
      detail: `${info.aspectRatio.toFixed(2)} deviates slightly from 16:9 (1.78). Minor cropping may occur.`,
    });
  } else {
    checks.push({
      label: "Aspect ratio",
      status: "fail",
      detail: `${info.aspectRatio.toFixed(2)} is far from 16:9 (1.78). YouTube will letterbox or crop significantly.`,
    });
  }

  // File size check
  const sizeMB = info.fileSize / (1024 * 1024);
  if (sizeMB <= 2) {
    checks.push({
      label: "File size",
      status: "pass",
      detail: `${sizeMB.toFixed(2)} MB is within YouTube's 2MB limit.`,
    });
  } else {
    checks.push({
      label: "File size",
      status: "fail",
      detail: `${sizeMB.toFixed(2)} MB exceeds YouTube's 2MB limit. Compress the image before uploading.`,
    });
  }

  return checks;
}

function StatusBadge({ status }: { status: "pass" | "warn" | "fail" }) {
  const map = {
    pass: { bg: "rgba(52,199,89,0.1)", color: "#34c759", text: "Pass" },
    warn: { bg: "rgba(255,159,10,0.1)", color: "#ff9f0a", text: "Warning" },
    fail: { bg: "rgba(255,59,48,0.1)", color: "#ff3b30", text: "Fail" },
  };
  const s = map[status];
  return (
    <span
      style={{
        padding: "3px 10px",
        background: s.bg,
        color: s.color,
        fontSize: 12,
        fontWeight: 600,
        borderRadius: 980,
        whiteSpace: "nowrap",
      }}
    >
      {s.text}
    </span>
  );
}

export function ThumbnailSizeTool() {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const info: ImageInfo = {
          width: img.naturalWidth,
          height: img.naturalHeight,
          fileSize: file.size,
          aspectRatio: img.naturalWidth / img.naturalHeight,
          url,
        };
        setImageInfo(info);
        setChecks(analyzeImage(info));
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

  return (
    <div>
      {/* Upload area */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          background: "#0a0a0a",
          borderRadius: 18,
          padding: imageInfo ? "16px" : "48px 28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          border: "2px dashed rgba(255,255,255,0.08)",
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
        {imageInfo ? (
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageInfo.url}
              alt="Uploaded thumbnail"
              style={{
                maxWidth: "100%",
                maxHeight: 400,
                borderRadius: 12,
                objectFit: "contain",
              }}
            />
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 12, marginBottom: 0 }}>
              Click or drag to replace
            </p>
          </div>
        ) : (
          <div>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
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
                color: "#ffffff",
                fontWeight: 500,
                margin: "0 0 8px",
              }}
            >
              Drop your thumbnail here or click to upload
            </p>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>
              JPG, PNG, GIF, or BMP
            </p>
          </div>
        )}
      </div>

      {/* Analysis results */}
      {checks.length > 0 && imageInfo && (
        <div style={{ marginTop: 24 }}>
          {/* Dimension info bar */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              marginBottom: 16,
              justifyContent: "center",
            }}
          >
            {[
              { label: "Dimensions", value: `${imageInfo.width}x${imageInfo.height}` },
              { label: "Ratio", value: imageInfo.aspectRatio.toFixed(2) },
              { label: "Size", value: `${(imageInfo.fileSize / 1024).toFixed(0)} KB` },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "#111111",
                  borderRadius: 12,
                  padding: "12px 20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 19, fontWeight: 600, color: "#ffffff", marginTop: 4 }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Check results */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {checks.map((check, i) => (
              <div
                key={i}
                style={{
                  background: "#0a0a0a",
                  borderRadius: 14,
                  padding: "16px 20px",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>
                    {check.label}
                  </span>
                  <StatusBadge status={check.status} />
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0 }}>
                  {check.detail}
                </p>
              </div>
            ))}
          </div>

          {/* YouTube preview */}
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
              Preview in YouTube layouts
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Search result preview */}
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Search result (246px)
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: 16,
                    background: "#1a1a1a",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageInfo.url}
                    alt="Search preview"
                    style={{
                      width: 246,
                      height: 138,
                      objectFit: "cover",
                      borderRadius: 8,
                      flexShrink: 0,
                      background: "#000",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#ffffff", lineHeight: 1.4 }}>
                      Your Video Title Here
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      Channel Name &middot; 10K views &middot; 2 days ago
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile feed preview */}
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Mobile feed (full width)
                </div>
                <div
                  style={{
                    maxWidth: 360,
                    padding: 12,
                    background: "#1a1a1a",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageInfo.url}
                    alt="Mobile feed preview"
                    style={{
                      width: "100%",
                      aspectRatio: "16/9",
                      objectFit: "cover",
                      borderRadius: 8,
                      background: "#000",
                    }}
                  />
                  <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.08)",
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", lineHeight: 1.3 }}>
                        Your Video Title Here
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                        Channel Name &middot; 10K views &middot; 2 days ago
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested sidebar preview */}
              <div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Suggested sidebar (168px)
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: 12,
                    background: "#1a1a1a",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imageInfo.url}
                    alt="Sidebar preview"
                    style={{
                      width: 168,
                      height: 94,
                      objectFit: "cover",
                      borderRadius: 6,
                      flexShrink: 0,
                      background: "#000",
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#ffffff", lineHeight: 1.3 }}>
                      Your Video Title Here
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                      Channel Name
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                      10K views &middot; 2 days ago
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
