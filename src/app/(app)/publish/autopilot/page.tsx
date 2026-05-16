"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const AutopilotPage = dynamic(
  () => import("@/views/Publish/AutopilotPage").then((m) => ({ default: m.AutopilotPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <AutopilotPage />
      </Suspense>
    </ErrorBoundary>
  );
}
