'use client';

import dynamic from 'next/dynamic';
import AiThumbnailsLoading from './loading';

const AiThumbnailsPage = dynamic(
  () => import('@/views/AiThumbnails/AiThumbnailsPage').then((m) => ({ default: m.AiThumbnailsPage })),
  { loading: () => <AiThumbnailsLoading />, ssr: false },
);

export default function Page() {
  return <AiThumbnailsPage />;
}
