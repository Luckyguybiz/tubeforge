"use client";

import { useState, useRef, useCallback } from "react";

export function ShortsDimensionsTool() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;

    setFileName(file.name);
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  function handleClear() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setFileName("");
    setImageDimensions(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const isCorrectRatio = imageDimensions
    ? Math.abs(imageDimensions.width / imageDimensions.height - 9 / 16) < 0.02
    : false;

  const isCorrectResolution = imageDimensions
    ? imageDimensions.width >= 1080 && imageDimensions.height >= 1920
    : false;

  return (
    <div>
      {/* Upload / Preview */}
      <div
        style={{
          background: "#0a0a0a",
          borderRadius: 18,
          padding: "28px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <h3 style={{ fontSize: 17, fontWeight: 600, color: "#ffffff", margin: "0 0 16px" }}>
          Preview your image as a YouTube Short
        </h3>

        {!imageUrl ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: "2px dashed rgba(255,255,255,0.08)",
              borderRadius: 14,
              padding: "48px 24px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: "#1a1a1a",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: "0 auto 12px", display: "block" }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>
              Drop an image here or click to upload
            </p>
            <p style={{ fontSize: 13, color: "#aeaeb2", margin: 0 }}>
              JPG, PNG, or WebP
            </p>
          </div>
        ) : (
          <div>
            {/* Phone frame preview */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  width: 220,
                  height: 391,
                  borderRadius: 24,
                  border: "4px solid #ffffff",
                  overflow: "hidden",
                  position: "relative",
                  background: "#000",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                }}
              >
                {/* Status bar mock */}
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 28,
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    paddingTop: 4,
                  }}
                >
                  <div style={{ width: 60, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.3)" }} />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Shorts preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                {/* Bottom overlay mock */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: 80,
                    background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)",
                    zIndex: 2,
                    display: "flex",
                    alignItems: "flex-end",
                    padding: "0 12px 10px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 600, color: "#fff" }}>@yourchannel</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.7)" }}>Video caption here...</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image info */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: "#1a1a1a",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>File</span>
                <span style={{ fontSize: 14, color: "#ffffff", fontWeight: 500 }}>{fileName}</span>
              </div>
              {imageDimensions && (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: "#1a1a1a",
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Dimensions</span>
                    <span style={{ fontSize: 14, color: "#ffffff", fontWeight: 500 }}>
                      {imageDimensions.width} x {imageDimensions.height}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: isCorrectRatio ? "rgba(52,199,89,0.06)" : "rgba(255,149,0,0.06)",
                      borderRadius: 10,
                      border: `1px solid ${isCorrectRatio ? "rgba(52,199,89,0.2)" : "rgba(255,149,0,0.2)"}`,
                    }}
                  >
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Aspect ratio</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isCorrectRatio ? "#34c759" : "#ff9500",
                      }}
                    >
                      {(imageDimensions.width / imageDimensions.height).toFixed(2)}{" "}
                      {isCorrectRatio ? "(9:16 — Perfect)" : "(Not 9:16)"}
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      background: isCorrectResolution ? "rgba(52,199,89,0.06)" : "rgba(255,149,0,0.06)",
                      borderRadius: 10,
                      border: `1px solid ${isCorrectResolution ? "rgba(52,199,89,0.2)" : "rgba(255,149,0,0.2)"}`,
                    }}
                  >
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>Resolution</span>
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: isCorrectResolution ? "#34c759" : "#ff9500",
                      }}
                    >
                      {isCorrectResolution ? "1080x1920 or higher — Great" : "Below recommended 1080x1920"}
                    </span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleClear}
              style={{
                width: "100%",
                padding: "12px 20px",
                background: "rgba(255,59,48,0.06)",
                color: "#ff3b30",
                fontSize: 15,
                fontWeight: 500,
                border: "none",
                borderRadius: 10,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Remove image
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}
