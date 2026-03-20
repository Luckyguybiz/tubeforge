'use client';

import { use } from 'react';
import { Suspense } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TOOL_COMPONENTS, TOOL_IDS, AVAILABLE_TOOL_IDS } from '@/views/Tools';
import { useThemeStore } from '@/stores/useThemeStore';

interface Props {
  params: Promise<{ toolId: string }>;
}

function ComingSoon({ toolId }: { toolId: string }) {
  const C = useThemeStore((s) => s.theme);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 400,
        padding: '40px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: `linear-gradient(135deg, ${C.accent}15, ${C.pink ?? C.accent}15)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          marginBottom: 24,
        }}
      >
        {'\uD83D\uDEA7'}
      </div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, letterSpacing: '-.02em', color: C.text }}>
        Coming Soon
      </h1>
      <p style={{ color: C.sub, fontSize: 15, lineHeight: 1.6, maxWidth: 400, marginBottom: 24 }}>
        This tool is currently under development. Check back soon!
      </p>
      <Link
        href="/tools"
        style={{
          padding: '12px 28px',
          borderRadius: 10,
          background: C.accent,
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
        }}
      >
        Back to Tools
      </Link>
    </div>
  );
}

export default function ToolPage({ params }: Props) {
  const { toolId } = use(params);

  if (!TOOL_IDS.includes(toolId)) {
    notFound();
  }

  // Block unavailable (coming soon) tools from rendering
  if (!AVAILABLE_TOOL_IDS.has(toolId)) {
    return <ComingSoon toolId={toolId} />;
  }

  const ToolComponent = TOOL_COMPONENTS[toolId];
  if (!ToolComponent) {
    notFound();
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <ToolComponent />
      </Suspense>
    </ErrorBoundary>
  );
}
