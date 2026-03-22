'use client';

import { ToolPageShell } from './ToolPageShell';
import { useThemeStore } from '@/stores/useThemeStore';

/* ═══════════════════════════════════════════════════════════════════════════
   Video Translator — AI-powered video translation with voice cloning
   ═══════════════════════════════════════════════════════════════════════════ */

export function VideoTranslator() {
  const C = useThemeStore((s) => s.theme);

  return (
    <ToolPageShell
      title="Video Translator"
      subtitle="Translate videos to 30+ languages with AI voice cloning"
      badge="PRO"
      gradient={['#06b6d4', '#0ea5e9']}
      comingSoon
    >
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: 15, color: C.sub, lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
          Preserve the original speaker&apos;s voice, tone, and emotion in any language.
          Upload a video, choose the target language, and let AI handle the rest.
        </p>
        <div style={{
          marginTop: 24,
          display: 'inline-flex',
          flexWrap: 'wrap',
          gap: 8,
          justifyContent: 'center',
        }}>
          {['Voice Cloning', 'Lip Sync', '30+ Languages', 'Emotion Preservation', 'Batch Processing'].map((feature) => (
            <span
              key={feature}
              style={{
                padding: '4px 12px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                background: '#06b6d412',
                color: '#06b6d4',
                border: '1px solid #06b6d420',
              }}
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </ToolPageShell>
  );
}
