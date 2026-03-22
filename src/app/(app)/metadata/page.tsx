'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

function MetadataRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'seo');
    router.replace(`/preview?${params.toString()}`);
  }, [router, searchParams]);

  return <Skeleton width="100%" height="80vh" />;
}

export default function MetadataPage() {
  return (
    <Suspense fallback={<Skeleton width="100%" height="80vh" />}>
      <MetadataRedirect />
    </Suspense>
  );
}
