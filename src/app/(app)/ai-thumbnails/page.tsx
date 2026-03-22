'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/Skeleton';

const AiThumbnailsPage = dynamic(
  () => import('@/views/AiThumbnails/AiThumbnailsPage').then((m) => ({ default: m.AiThumbnailsPage })),
  { loading: () => <Skeleton width="100%" height="80vh" />, ssr: false },
);

export default function Page() {
  return <AiThumbnailsPage />;
}
