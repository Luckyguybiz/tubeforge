'use client';

import { use } from 'react';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { TOOL_COMPONENTS, TOOL_IDS } from '@/views/Tools';

interface Props {
  params: Promise<{ toolId: string }>;
}

export default function ToolPage({ params }: Props) {
  const { toolId } = use(params);

  if (!TOOL_IDS.includes(toolId)) {
    notFound();
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
