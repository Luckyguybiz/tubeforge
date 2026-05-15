"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const PublishPage = dynamic(
  () => import("@/views/Publish/PublishPage").then((m) => ({ default: m.PublishPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <PublishPage />
      </Suspense>
    </ErrorBoundary>
  );
}
