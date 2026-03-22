'use client';

import { useThemeStore } from '@/stores/useThemeStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Video Translator — AI-powered video translation with voice cloning
   ═══════════════════════════════════════════════════════════════════════════ */

export function VideoTranslator() {
  const C = useThemeStore((s) => s.theme);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        padding: '60px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: `linear-gradient(135deg, #06b6d415, #0ea5e915)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          marginBottom: 24,
        }}
      >
        {'\uD83C\uDF0D'}
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: '-.03em',
          marginBottom: 8,
          color: C.text,
        }}
      >
        Video Translator
      </h1>
      <p
        style={{
          color: C.sub,
          fontSize: 16,
          lineHeight: 1.6,
          maxWidth: 480,
          marginBottom: 12,
        }}
      >
        Translate videos to 30+ languages with AI voice cloning. Preserve the
        original speaker's voice, tone, and emotion in any language.
      </p>
      <span
        style={{
          display: 'inline-block',
          padding: '4px 14px',
          borderRadius: 8,
          background: `linear-gradient(135deg, ${C.accent}, ${C.pink ?? C.accent})`,
          color: '#fff',
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: '.03em',
          marginBottom: 28,
        }}
      >
        PRO
      </span>
      <p style={{ color: C.dim, fontSize: 14, lineHeight: 1.6, maxWidth: 420 }}>
        This tool is coming soon. Upgrade to Pro to get early access when it launches.
      </p>
    </div>
  );
}
