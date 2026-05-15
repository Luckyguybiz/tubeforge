"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

const JobsPage = dynamic(
  () => import("@/views/Publish/JobsPage").then((m) => ({ default: m.JobsPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
        <JobsPage />
      </Suspense>
    </ErrorBoundary>
  );
}
